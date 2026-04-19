package application

import (
	"context"
	"time"

	"task-manager/backend/internal/domain/note"
	"task-manager/backend/internal/domain/project"
	"task-manager/backend/internal/domain/task"
	"task-manager/backend/internal/domain/user"
	"task-manager/backend/internal/infrastructure/persistence/notestore"
	"task-manager/backend/internal/infrastructure/persistence/taskstore"

	"gorm.io/gorm"
)

// SectionItemsReorderService — общая перенумерация задач и заметок внутри секции проекта.
type SectionItemsReorderService struct {
	Tasks    task.Repository
	Notes    note.Repository
	Projects project.Repository
	DB       *gorm.DB
	Clock    func() time.Time
}

// NewSectionItemsReorderService создаёт сервис.
func NewSectionItemsReorderService(
	tasks task.Repository,
	notes note.Repository,
	projects project.Repository,
	db *gorm.DB,
) *SectionItemsReorderService {
	return &SectionItemsReorderService{
		Tasks:    tasks,
		Notes:    notes,
		Projects: projects,
		DB:       db,
		Clock:    time.Now,
	}
}

// SectionItemRef — один элемент смешанного порядка.
type SectionItemRef struct {
	Kind string `json:"kind" binding:"required"` // "task" | "note"
	ID   uint   `json:"id" binding:"required"`
}

// SectionItemsReorderInput — полный список id в желаемом порядке.
type SectionItemsReorderInput struct {
	ProjectID uint
	SectionID *uint
	Items     []SectionItemRef
}

// Reorder выставляет position = index+1 для каждого элемента (общая шкала в секции).
func (s *SectionItemsReorderService) Reorder(ctx context.Context, callerID uint, role user.Role, in SectionItemsReorderInput) error {
	if in.ProjectID == 0 || len(in.Items) == 0 {
		return ErrInvalidInput
	}
	ts := &TaskService{Tasks: s.Tasks, Projects: s.Projects, Users: nil, Clock: s.Clock}
	ok, err := ts.CanManageProjectTasks(ctx, in.ProjectID, callerID, role)
	if err != nil {
		return err
	}
	if !ok {
		return ErrForbidden
	}

	var wantSec *project.SectionID
	if in.SectionID != nil {
		v := project.SectionID(*in.SectionID)
		wantSec = &v
	}
	p, err := s.Projects.FindByID(ctx, project.ID(in.ProjectID))
	if err != nil {
		return err
	}
	if wantSec != nil && p.SectionByID(*wantSec) == nil {
		return project.ErrSectionNotFound
	}

	now := s.Clock()
	return s.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		taskIDs, err := listTaskIDsInSection(tx, in.ProjectID, in.SectionID)
		if err != nil {
			return err
		}
		noteIDs, err := listNoteIDsInSection(tx, in.ProjectID, in.SectionID)
		if err != nil {
			return err
		}
		if len(in.Items) != len(taskIDs)+len(noteIDs) {
			return ErrInvalidInput
		}

		wantKeys := make(map[itemKey]struct{}, len(taskIDs)+len(noteIDs))
		for _, id := range taskIDs {
			wantKeys[itemKey{kind: "task", id: id}] = struct{}{}
		}
		for _, id := range noteIDs {
			wantKeys[itemKey{kind: "note", id: id}] = struct{}{}
		}
		gotKeys := make(map[itemKey]struct{}, len(in.Items))
		for _, it := range in.Items {
			k := itemKey{kind: it.Kind, id: it.ID}
			if _, dup := gotKeys[k]; dup {
				return ErrInvalidInput
			}
			gotKeys[k] = struct{}{}
			if _, ok := wantKeys[k]; !ok {
				return ErrInvalidInput
			}
		}
		if len(gotKeys) != len(wantKeys) {
			return ErrInvalidInput
		}

		for i, it := range in.Items {
			pos := i + 1
			switch it.Kind {
			case "task":
				if err := tx.Model(&taskstore.TaskRecord{}).Where("id = ? AND project_id = ?", it.ID, in.ProjectID).
					Updates(map[string]any{"position": pos, "updated_at": now}).Error; err != nil {
					return err
				}
			case "note":
				if err := tx.Model(&notestore.NoteRecord{}).Where("id = ? AND project_id = ? AND deleted_at IS NULL", it.ID, in.ProjectID).
					Updates(map[string]any{"position": pos, "updated_at": now}).Error; err != nil {
					return err
				}
			default:
				return ErrInvalidInput
			}
		}
		return nil
	})
}

type itemKey struct {
	kind string
	id   uint
}

func listTaskIDsInSection(tx *gorm.DB, projectID uint, sectionID *uint) ([]uint, error) {
	q := tx.Model(&taskstore.TaskRecord{}).Where("project_id = ?", projectID)
	if sectionID == nil {
		q = q.Where("section_id IS NULL")
	} else {
		q = q.Where("section_id = ?", *sectionID)
	}
	var ids []uint
	if err := q.Order("position ASC, id ASC").Pluck("id", &ids).Error; err != nil {
		return nil, err
	}
	return ids, nil
}

func listNoteIDsInSection(tx *gorm.DB, projectID uint, sectionID *uint) ([]uint, error) {
	q := tx.Model(&notestore.NoteRecord{}).Where("project_id = ? AND deleted_at IS NULL", projectID)
	if sectionID == nil {
		q = q.Where("section_id IS NULL")
	} else {
		q = q.Where("section_id = ?", *sectionID)
	}
	var ids []uint
	if err := q.Order("position ASC, id ASC").Pluck("id", &ids).Error; err != nil {
		return nil, err
	}
	return ids, nil
}
