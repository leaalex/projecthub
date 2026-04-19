package application

import (
	"context"
	"time"

	"task-manager/backend/internal/domain/project"
	"task-manager/backend/internal/domain/task"
	"task-manager/backend/internal/domain/user"
	"task-manager/backend/internal/infrastructure/persistence/taskstore"

	"gorm.io/gorm"
)

// TaskMoveService — перенос задачи между секциями с перенумерацией позиций.
type TaskMoveService struct {
	Tasks    task.Repository
	Projects project.Repository
	DB       *gorm.DB
	Clock    func() time.Time
}

// NewTaskMoveService создаёт сервис.
func NewTaskMoveService(tasks task.Repository, projects project.Repository, db *gorm.DB) *TaskMoveService {
	return &TaskMoveService{
		Tasks:    tasks,
		Projects: projects,
		DB:       db,
		Clock:    time.Now,
	}
}

// TaskMoveInput — параметры перемещения.
type TaskMoveInput struct {
	TaskID    uint
	ProjectID uint
	SectionID *uint
	Position  *int
}

// Move изменяет секцию задачи и переупорядочивает позиции сиблингов.
// Проверки ACL и секции выполняются до транзакции, чтобы не держать SQLite-блокировку
// при запросах к project.Repository на корневом *gorm.DB (избегаем deadlock).
func (s *TaskMoveService) Move(ctx context.Context, callerID uint, role user.Role, in TaskMoveInput) (*task.Task, error) {
	if in.TaskID == 0 || in.ProjectID == 0 {
		return nil, ErrInvalidInput
	}

	tk, err := s.Tasks.FindByID(ctx, task.ID(in.TaskID))
	if err != nil {
		return nil, err
	}
	if tk.ProjectID().Uint() != in.ProjectID {
		return nil, ErrForbidden
	}
	if !user.IsSystemRole(role) {
		if tk.AssigneeID() == nil || tk.AssigneeID().Uint() != callerID {
			ok, err := s.Projects.IsOwner(ctx, tk.ProjectID(), user.ID(callerID))
			if err != nil {
				return nil, err
			}
			if !ok {
				ok2, err := s.Projects.AssigneeAllowed(ctx, tk.ProjectID(), user.ID(callerID))
				if err != nil || !ok2 {
					if err == nil {
						err = ErrForbidden
					}
					return nil, err
				}
			}
		}
	}
	ts := &TaskService{Tasks: s.Tasks, Projects: s.Projects, Users: nil, Clock: s.Clock}
	ok, err := ts.CanManageProjectTasks(ctx, tk.ProjectID().Uint(), callerID, role)
	if err != nil {
		return nil, err
	}
	if !ok {
		return nil, ErrForbidden
	}
	var secID *project.SectionID
	if in.SectionID != nil {
		sid := project.SectionID(*in.SectionID)
		secID = &sid
	}
	if err := ts.ensureSectionInProject(ctx, tk.ProjectID(), secID); err != nil {
		return nil, err
	}

	var out *task.Task
	err = s.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var siblings []taskstore.TaskRecord
		sq := tx.Where("project_id = ?", tk.ProjectID().Uint()).Where("id <> ?", tk.ID().Uint())
		if secID == nil {
			sq = sq.Where("section_id IS NULL")
		} else {
			sq = sq.Where("section_id = ?", secID.Uint())
		}
		if err := sq.Order("position ASC, id ASC").Find(&siblings).Error; err != nil {
			return err
		}

		insertPos := len(siblings)
		if in.Position != nil {
			if *in.Position < 0 {
				return ErrInvalidInput
			}
			if *in.Position < insertPos {
				insertPos = *in.Position
			}
		}

		currentSection := tk.SectionID()
		var newSecPtr *uint
		if secID != nil {
			v := secID.Uint()
			newSecPtr = &v
		}

		var selfRec taskstore.TaskRecord
		if err := tx.First(&selfRec, tk.ID().Uint()).Error; err != nil {
			return err
		}
		selfRec.SectionID = newSecPtr

		ordered := make([]taskstore.TaskRecord, 0, len(siblings)+1)
		ordered = append(ordered, siblings[:insertPos]...)
		ordered = append(ordered, selfRec)
		ordered = append(ordered, siblings[insertPos:]...)

		for idx := range ordered {
			up := map[string]any{
				"section_id": ordered[idx].SectionID,
				"position":   idx + 1,
			}
			if err := tx.Model(&taskstore.TaskRecord{}).Where("id = ?", ordered[idx].ID).Updates(up).Error; err != nil {
				return err
			}
		}

		sameSection := (currentSection == nil && secID == nil) ||
			(currentSection != nil && secID != nil && currentSection.Uint() == secID.Uint())
		if !sameSection {
			var old []taskstore.TaskRecord
			oq := tx.Where("project_id = ?", tk.ProjectID().Uint()).Where("id <> ?", tk.ID().Uint())
			if currentSection == nil {
				oq = oq.Where("section_id IS NULL")
			} else {
				oq = oq.Where("section_id = ?", currentSection.Uint())
			}
			if err := oq.Order("position ASC, id ASC").Find(&old).Error; err != nil {
				return err
			}
			for idx := range old {
				if err := tx.Model(&taskstore.TaskRecord{}).Where("id = ?", old[idx].ID).Update("position", idx+1).Error; err != nil {
					return err
				}
			}
		}

		repo := taskstore.NewGormRepository(tx)
		var err2 error
		out, err2 = repo.FindByID(ctx, task.ID(in.TaskID))
		return err2
	})
	if err != nil {
		return nil, err
	}
	return out, nil
}
