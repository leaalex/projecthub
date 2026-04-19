package application

import (
	"context"

	"task-manager/backend/internal/domain/project"
	"task-manager/backend/internal/domain/task"
	"task-manager/backend/internal/domain/user"
)

// TaskTrashService — управление корзиной задач (restore + permanent delete).
type TaskTrashService struct {
	Tasks    task.Repository
	Projects project.Repository
}

// NewTaskTrashService создаёт сервис корзины задач.
func NewTaskTrashService(tasks task.Repository, projects project.Repository) *TaskTrashService {
	return &TaskTrashService{Tasks: tasks, Projects: projects}
}

func (s *TaskTrashService) canManage(ctx context.Context, projectID, callerID uint, role user.Role) (bool, error) {
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

// Get возвращает одну мягко удалённую задачу проекта (для просмотра в корзине).
func (s *TaskTrashService) Get(ctx context.Context, taskID, projectID, callerID uint, role user.Role) (*task.Task, error) {
	ok, err := s.canManage(ctx, projectID, callerID, role)
	if err != nil {
		return nil, err
	}
	if !ok {
		return nil, project.ErrForbidden
	}
	return s.Tasks.FindDeletedByIDInProject(ctx, project.ID(projectID), task.ID(taskID))
}

// ListDeleted возвращает мягко удалённые задачи проекта.
func (s *TaskTrashService) ListDeleted(ctx context.Context, projectID, callerID uint, role user.Role) ([]*task.Task, error) {
	ok, err := s.canManage(ctx, projectID, callerID, role)
	if err != nil {
		return nil, err
	}
	if !ok {
		return nil, project.ErrForbidden
	}
	return s.Tasks.ListDeletedByProject(ctx, project.ID(projectID))
}

// Restore снимает мягкое удаление задачи.
func (s *TaskTrashService) Restore(ctx context.Context, taskID, projectID, callerID uint, role user.Role) error {
	ok, err := s.canManage(ctx, projectID, callerID, role)
	if err != nil {
		return err
	}
	if !ok {
		return project.ErrForbidden
	}
	return s.Tasks.Restore(ctx, task.ID(taskID))
}

// HardDelete физически удаляет задачу.
func (s *TaskTrashService) HardDelete(ctx context.Context, taskID, projectID, callerID uint, role user.Role) error {
	ok, err := s.canManage(ctx, projectID, callerID, role)
	if err != nil {
		return err
	}
	if !ok {
		return project.ErrForbidden
	}
	return s.Tasks.HardDelete(ctx, task.ID(taskID))
}
