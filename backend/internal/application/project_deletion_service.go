package application

import (
	"context"

	"task-manager/backend/internal/domain/project"
	"task-manager/backend/internal/domain/task"
	"task-manager/backend/internal/domain/user"
	"task-manager/backend/internal/infrastructure/persistence/projectstore"
	"task-manager/backend/internal/infrastructure/persistence/taskstore"

	"gorm.io/gorm"
)

// ProjectDeletionService — soft-delete, restore и жёсткое удаление с каскадом по задачам.
type ProjectDeletionService struct {
	Projects project.Repository
	Tasks    task.Repository
	DB       *gorm.DB
}

// NewProjectDeletionService создаёт сервис.
func NewProjectDeletionService(projects project.Repository, tasks task.Repository, db *gorm.DB) *ProjectDeletionService {
	return &ProjectDeletionService{Projects: projects, Tasks: tasks, DB: db}
}

func (s *ProjectDeletionService) canHardOrSoft(ctx context.Context, id project.ID, callerID uint, role user.Role) error {
	if user.IsSystemRole(role) {
		return nil
	}
	ok, err := s.Projects.IsOwnerIncludingDeleted(ctx, id, user.ID(callerID))
	if err != nil {
		return err
	}
	if !ok {
		return project.ErrForbidden
	}
	return nil
}

// SoftDelete помечает проект удалённым (владелец или системная роль).
func (s *ProjectDeletionService) SoftDelete(ctx context.Context, id, callerID uint, role user.Role) error {
	if err := s.canHardOrSoft(ctx, project.ID(id), callerID, role); err != nil {
		return err
	}
	return s.Projects.SoftDelete(ctx, project.ID(id))
}

// Restore снимает soft-delete (владелец или системная роль).
func (s *ProjectDeletionService) Restore(ctx context.Context, id, callerID uint, role user.Role) error {
	if user.IsSystemRole(role) {
		return s.Projects.Restore(ctx, project.ID(id))
	}
	ok, err := s.Projects.IsOwnerIncludingDeleted(ctx, project.ID(id), user.ID(callerID))
	if err != nil {
		return err
	}
	if !ok {
		return project.ErrForbidden
	}
	return s.Projects.Restore(ctx, project.ID(id))
}

// HardDelete физически удаляет задачи, затем участников, секции и проект.
func (s *ProjectDeletionService) HardDelete(ctx context.Context, id, callerID uint, role user.Role) error {
	if err := s.canHardOrSoft(ctx, project.ID(id), callerID, role); err != nil {
		return err
	}
	return s.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		tr := taskstore.NewGormRepository(tx)
		if err := tr.DeleteByProject(ctx, project.ID(id)); err != nil {
			return err
		}
		pr := projectstore.NewGormRepository(tx)
		return pr.HardDelete(ctx, project.ID(id))
	})
}
