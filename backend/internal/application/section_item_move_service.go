package application

import (
	"context"
	"sort"
	"time"

	"task-manager/backend/internal/domain/note"
	"task-manager/backend/internal/domain/ordering"
	"task-manager/backend/internal/domain/project"
	"task-manager/backend/internal/domain/task"
	"task-manager/backend/internal/domain/user"
	"task-manager/backend/internal/infrastructure/persistence/notestore"
	"task-manager/backend/internal/infrastructure/persistence/taskstore"

	"gorm.io/gorm"
)

// SectionItemRef identifies one row in the mixed task+note ordering within a section.
type SectionItemRef struct {
	Kind string `json:"kind" binding:"required"` // "task" | "note"
	ID   uint   `json:"id" binding:"required"`
}

// SectionItemMoveInput — перемещение задачи или заметки в секции с порядком между соседями.
type SectionItemMoveInput struct {
	ProjectID uint
	Kind      string // "task" | "note"
	ItemID    uint
	SectionID *uint  // nil = без секции
	BeforeID  *SectionItemRef
	AfterID   *SectionItemRef
}

// SectionItemMoveResult — результат move (ровно одно поле не-nil).
type SectionItemMoveResult struct {
	Task *task.Task
	Note *note.Note
}

// SectionItemMoveService — единая точка перемещения задач и заметок с разрежёнными position.
type SectionItemMoveService struct {
	Tasks    task.Repository
	Notes    note.Repository
	Projects project.Repository
	DB       *gorm.DB
	Clock    func() time.Time
}

// NewSectionItemMoveService создаёт сервис.
func NewSectionItemMoveService(
	tasks task.Repository,
	notes note.Repository,
	projects project.Repository,
	db *gorm.DB,
) *SectionItemMoveService {
	return &SectionItemMoveService{
		Tasks:    tasks,
		Notes:    notes,
		Projects: projects,
		DB:       db,
		Clock:    time.Now,
	}
}

type mixedSibling struct {
	kind string
	id   uint
	pos  int64
}

func (s *SectionItemMoveService) ensureSection(ctx context.Context, pid uint, sectionID *uint) error {
	if sectionID == nil {
		return nil
	}
	p, err := s.Projects.FindByID(ctx, project.ID(pid))
	if err != nil {
		return err
	}
	sid := project.SectionID(*sectionID)
	if p.SectionByID(sid) == nil {
		return project.ErrSectionNotFound
	}
	return nil
}

func (s *SectionItemMoveService) canMoveNote(ctx context.Context, projectID, callerID uint, role user.Role) (bool, error) {
	if user.IsSystemRole(role) {
		return true, nil
	}
	ok, err := s.Projects.IsOwner(ctx, project.ID(projectID), user.ID(callerID))
	if err != nil || ok {
		return ok, err
	}
	r, has, err := s.Projects.GetMemberRole(ctx, project.ID(projectID), user.ID(callerID))
	if err != nil || !has {
		return false, err
	}
	return r == project.RoleManager, nil
}

func (s *SectionItemMoveService) canMoveTask(ctx context.Context, tk *task.Task, callerID uint, role user.Role) (bool, error) {
	if !user.IsSystemRole(role) {
		if tk.AssigneeID() == nil || tk.AssigneeID().Uint() != callerID {
			ok, err := s.Projects.IsOwner(ctx, tk.ProjectID(), user.ID(callerID))
			if err != nil {
				return false, err
			}
			if !ok {
				ok2, err := s.Projects.AssigneeAllowed(ctx, tk.ProjectID(), user.ID(callerID))
				if err != nil || !ok2 {
					if err == nil {
						err = ErrForbidden
					}
					return false, err
				}
			}
		}
	}
	ts := &TaskService{Tasks: s.Tasks, Projects: s.Projects, Users: nil, Clock: s.Clock}
	ok, err := ts.CanManageProjectTasks(ctx, tk.ProjectID().Uint(), callerID, role)
	if err != nil {
		return false, err
	}
	if !ok {
		return false, ErrForbidden
	}
	return true, nil
}

func loadMixedSiblings(tx *gorm.DB, projectID uint, sectionID *uint, excludeKind string, excludeID uint) ([]mixedSibling, error) {
	var tasks []taskstore.TaskRecord
	tq := tx.Model(&taskstore.TaskRecord{}).Where("project_id = ? AND deleted_at IS NULL", projectID)
	if sectionID == nil {
		tq = tq.Where("section_id IS NULL")
	} else {
		tq = tq.Where("section_id = ?", *sectionID)
	}
	if err := tq.Order("position ASC, id ASC").Find(&tasks).Error; err != nil {
		return nil, err
	}
	var notes []notestore.NoteRecord
	nq := tx.Model(&notestore.NoteRecord{}).Where("project_id = ? AND deleted_at IS NULL", projectID)
	if sectionID == nil {
		nq = nq.Where("section_id IS NULL")
	} else {
		nq = nq.Where("section_id = ?", *sectionID)
	}
	if err := nq.Order("position ASC, id ASC").Find(&notes).Error; err != nil {
		return nil, err
	}
	out := make([]mixedSibling, 0, len(tasks)+len(notes))
	for _, t := range tasks {
		if excludeKind == "task" && t.ID == excludeID {
			continue
		}
		out = append(out, mixedSibling{kind: "task", id: t.ID, pos: int64(t.Position)})
	}
	for _, n := range notes {
		if excludeKind == "note" && n.ID == excludeID {
			continue
		}
		out = append(out, mixedSibling{kind: "note", id: n.ID, pos: int64(n.Position)})
	}
	sort.SliceStable(out, func(i, j int) bool {
		if out[i].pos != out[j].pos {
			return out[i].pos < out[j].pos
		}
		if out[i].id != out[j].id {
			return out[i].id < out[j].id
		}
		return out[i].kind < out[j].kind
	})
	return out, nil
}

func findMixedIndex(s []mixedSibling, ref *SectionItemRef) int {
	if ref == nil {
		return -1
	}
	for i := range s {
		if s[i].kind == ref.Kind && s[i].id == ref.ID {
			return i
		}
	}
	return -1
}

func refPointsToSelf(ref *SectionItemRef, kind string, id uint) bool {
	return ref != nil && ref.Kind == kind && ref.ID == id
}

// Move перемещает элемент в целевую секцию и задаёт position между before и after (или в конец, если оба nil).
// position и section_id пишутся через UpdateColumns, чтобы не трогать updated_at: DnD не семантическое изменение.
func (s *SectionItemMoveService) Move(ctx context.Context, callerID uint, role user.Role, in SectionItemMoveInput) (*SectionItemMoveResult, error) {
	if in.ProjectID == 0 || in.ItemID == 0 {
		return nil, ErrInvalidInput
	}
	switch in.Kind {
	case "task", "note":
	default:
		return nil, ErrInvalidInput
	}
	if refPointsToSelf(in.BeforeID, in.Kind, in.ItemID) || refPointsToSelf(in.AfterID, in.Kind, in.ItemID) {
		return nil, ErrInvalidInput
	}
	if in.BeforeID != nil && in.AfterID != nil &&
		in.BeforeID.Kind == in.AfterID.Kind && in.BeforeID.ID == in.AfterID.ID {
		return nil, ErrInvalidInput
	}

	if err := s.ensureSection(ctx, in.ProjectID, in.SectionID); err != nil {
		return nil, err
	}

	switch in.Kind {
	case "task":
		tk, err := s.Tasks.FindByID(ctx, task.ID(in.ItemID))
		if err != nil {
			return nil, err
		}
		if tk.ProjectID().Uint() != in.ProjectID {
			return nil, ErrForbidden
		}
		ok, err := s.canMoveTask(ctx, tk, callerID, role)
		if err != nil {
			return nil, err
		}
		if !ok {
			return nil, ErrForbidden
		}
	case "note":
		noteEnt, err := s.Notes.FindByID(ctx, note.ID(in.ItemID))
		if err != nil {
			return nil, err
		}
		if noteEnt.ProjectID().Uint() != in.ProjectID {
			return nil, ErrForbidden
		}
		ok, err := s.canMoveNote(ctx, in.ProjectID, callerID, role)
		if err != nil {
			return nil, err
		}
		if !ok {
			return nil, ErrForbidden
		}
	}

	var result *SectionItemMoveResult

	err := s.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		siblings, err := loadMixedSiblings(tx, in.ProjectID, in.SectionID, in.Kind, in.ItemID)
		if err != nil {
			return err
		}

		insertAt := len(siblings)
		if in.BeforeID != nil || in.AfterID != nil {
			beforeIdx := findMixedIndex(siblings, in.BeforeID)
			afterIdx := findMixedIndex(siblings, in.AfterID)
			switch {
			case in.BeforeID != nil && in.AfterID != nil:
				if beforeIdx < 0 || afterIdx < 0 || afterIdx != beforeIdx+1 {
					return ErrInvalidInput
				}
				insertAt = afterIdx
			case in.BeforeID != nil && in.AfterID == nil:
				if beforeIdx < 0 {
					return ErrInvalidInput
				}
				insertAt = beforeIdx + 1
			case in.BeforeID == nil && in.AfterID != nil:
				if afterIdx < 0 {
					return ErrInvalidInput
				}
				insertAt = afterIdx
			}
		} else if len(siblings) > 0 {
			// append в конец
			insertAt = len(siblings)
		} else {
			insertAt = 0
		}

		var leftPos, rightPos *int64
		if insertAt > 0 {
			v := siblings[insertAt-1].pos
			leftPos = &v
		}
		if insertAt < len(siblings) {
			v := siblings[insertAt].pos
			rightPos = &v
		}

		newPos, ok := ordering.Between(leftPos, rightPos)
		if !ok {
			ordered := make([]mixedSibling, 0, len(siblings)+1)
			ordered = append(ordered, siblings[:insertAt]...)
			ordered = append(ordered, mixedSibling{kind: in.Kind, id: in.ItemID, pos: 0})
			ordered = append(ordered, siblings[insertAt:]...)
			seq := ordering.InitialSequence(len(ordered))
			for i := range ordered {
				pos := int(seq[i])
				it := ordered[i]
				switch it.kind {
				case "task":
					up := map[string]any{"position": pos}
					if it.kind == in.Kind && it.id == in.ItemID {
						up["section_id"] = in.SectionID
					}
					if err := tx.Model(&taskstore.TaskRecord{}).Where("id = ? AND project_id = ?", it.id, in.ProjectID).
						UpdateColumns(up).Error; err != nil {
						return err
					}
				case "note":
					up := map[string]any{"position": pos}
					if it.kind == in.Kind && it.id == in.ItemID {
						up["section_id"] = in.SectionID
					}
					if err := tx.Model(&notestore.NoteRecord{}).Where("id = ? AND project_id = ? AND deleted_at IS NULL", it.id, in.ProjectID).
						UpdateColumns(up).Error; err != nil {
						return err
					}
				default:
					return ErrInvalidInput
				}
			}
		} else {
			switch in.Kind {
			case "task":
				if err := tx.Model(&taskstore.TaskRecord{}).
					Where("id = ? AND project_id = ?", in.ItemID, in.ProjectID).
					UpdateColumns(map[string]any{"section_id": in.SectionID, "position": int(newPos)}).Error; err != nil {
					return err
				}
			case "note":
				if err := tx.Model(&notestore.NoteRecord{}).
					Where("id = ? AND project_id = ? AND deleted_at IS NULL", in.ItemID, in.ProjectID).
					UpdateColumns(map[string]any{"section_id": in.SectionID, "position": int(newPos)}).Error; err != nil {
					return err
				}
			default:
				return ErrInvalidInput
			}
		}

		switch in.Kind {
		case "task":
			repo := taskstore.NewGormRepository(tx)
			tk, err := repo.FindByID(ctx, task.ID(in.ItemID))
			if err != nil {
				return err
			}
			result = &SectionItemMoveResult{Task: tk}
			return nil
		case "note":
			repo := notestore.NewGormRepository(tx)
			n, err := repo.FindByID(ctx, note.ID(in.ItemID))
			if err != nil {
				return err
			}
			result = &SectionItemMoveResult{Note: n}
			return nil
		default:
			return ErrInvalidInput
		}
	})
	if err != nil {
		return nil, err
	}
	return result, nil
}
