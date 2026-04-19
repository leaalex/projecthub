package application

import (
	"context"
	"errors"
	"time"

	"task-manager/backend/internal/domain/project"
	"task-manager/backend/internal/domain/task"
	"task-manager/backend/internal/domain/user"
)

// TaskAssignService — назначение исполнителя на задачу.
type TaskAssignService struct {
	Tasks    task.Repository
	Projects project.Repository
	Users    user.Repository
	Clock    func() time.Time
}

// NewTaskAssignService создаёт сервис.
func NewTaskAssignService(tasks task.Repository, projects project.Repository, users user.Repository) *TaskAssignService {
	return &TaskAssignService{
		Tasks:    tasks,
		Projects: projects,
		Users:    users,
		Clock:    time.Now,
	}
}

// Assign назначает пользователя или снимает назначение при assigneeID == 0.
func (s *TaskAssignService) Assign(ctx context.Context, taskID, callerID uint, role user.Role, assigneeID uint) (*task.Task, error) {
	ts := &TaskService{Tasks: s.Tasks, Projects: s.Projects, Users: s.Users, Clock: s.Clock}
	t, err := ts.Get(ctx, taskID, callerID, role)
	if err != nil {
		return nil, err
	}
	ok, err := ts.CanManageProjectTasks(ctx, t.ProjectID().Uint(), callerID, role)
	if err != nil || !ok {
		if err == nil {
			err = ErrForbidden
		}
		return nil, err
	}
	now := s.Clock()
	if assigneeID == 0 {
		t.Unassign(now)
		if err := s.Tasks.Save(ctx, t); err != nil {
			return nil, err
		}
		return s.Tasks.FindByID(ctx, task.ID(taskID))
	}
	if _, err := s.Users.FindByID(ctx, user.ID(assigneeID)); err != nil {
		if errors.Is(err, user.ErrUserNotFound) {
			return nil, ErrInvalidInput
		}
		return nil, err
	}
	allowed, err := s.Projects.AssigneeAllowed(ctx, t.ProjectID(), user.ID(assigneeID))
	if err != nil {
		return nil, err
	}
	if !allowed {
		return nil, ErrAssigneeNotProjectMember
	}
	u := user.ID(assigneeID)
	t.Assign(&u, now)
	if err := s.Tasks.Save(ctx, t); err != nil {
		return nil, err
	}
	return s.Tasks.FindByID(ctx, task.ID(taskID))
}
