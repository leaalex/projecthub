package application

import (
	"context"
	"strings"
	"time"

	"task-manager/backend/internal/domain/project"
	"task-manager/backend/internal/domain/task"
	"task-manager/backend/internal/domain/user"
)

// TaskService — сценарии CRUD задач и подзадач с ACL.
type TaskService struct {
	Tasks    task.Repository
	Projects project.Repository
	Users    user.Repository
	Clock    func() time.Time
}

// NewTaskService создаёт сервис. Clock по умолчанию — time.Now.
func NewTaskService(tasks task.Repository, projects project.Repository, users user.Repository) *TaskService {
	return &TaskService{
		Tasks:    tasks,
		Projects: projects,
		Users:    users,
		Clock:    time.Now,
	}
}

func unionUintIDs(a, b []uint) []uint {
	seen := make(map[uint]struct{}, len(a)+len(b))
	out := make([]uint, 0, len(a)+len(b))
	for _, x := range a {
		if _, ok := seen[x]; ok {
			continue
		}
		seen[x] = struct{}{}
		out = append(out, x)
	}
	for _, x := range b {
		if _, ok := seen[x]; ok {
			continue
		}
		seen[x] = struct{}{}
		out = append(out, x)
	}
	return out
}

// VisibleProjectIDs — порт для отчётов: проекты, где пользователь владелец или участник.
func (s *TaskService) VisibleProjectIDs(ctx context.Context, userID uint) ([]uint, error) {
	uid := user.ID(userID)
	owned, err := s.Projects.ListOwnedProjectIDs(ctx, uid)
	if err != nil {
		return nil, err
	}
	memberships, err := s.Projects.ListMemberships(ctx, uid)
	if err != nil {
		return nil, err
	}
	members := make([]uint, len(memberships))
	for i, id := range memberships {
		members[i] = id.Uint()
	}
	return unionUintIDs(owned, members), nil
}

// CanManageProjectTasks — владелец, менеджер-участник или системная роль.
func (s *TaskService) CanManageProjectTasks(ctx context.Context, projectID, callerID uint, role user.Role) (bool, error) {
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

func (s *TaskService) canAccessTask(ctx context.Context, t *task.Task, callerID uint, role user.Role) bool {
	if user.IsSystemRole(role) {
		return true
	}
	if aid := t.AssigneeID(); aid != nil && aid.Uint() == callerID {
		return true
	}
	ok, err := s.Projects.IsOwner(ctx, t.ProjectID(), user.ID(callerID))
	if err != nil || ok {
		return ok
	}
	ok2, err := s.Projects.AssigneeAllowed(ctx, t.ProjectID(), user.ID(callerID))
	return err == nil && ok2
}

func (s *TaskService) ensureSectionInProject(ctx context.Context, pid project.ID, sectionID *project.SectionID) error {
	if sectionID == nil {
		return nil
	}
	p, err := s.Projects.FindByID(ctx, pid)
	if err != nil {
		return err
	}
	if p.SectionByID(*sectionID) == nil {
		return task.ErrTaskSectionNotFound
	}
	return nil
}

// TaskCallerACL — JSON-only поля для текущего пользователя.
type TaskCallerACL struct {
	CanManage       bool
	CanChangeStatus bool
}

// CallerTaskACL вычисляет ACL для задачи.
func (s *TaskService) CallerTaskACL(ctx context.Context, t *task.Task, callerID uint, role user.Role) (TaskCallerACL, error) {
	m, err := s.CanManageProjectTasks(ctx, t.ProjectID().Uint(), callerID, role)
	if err != nil {
		return TaskCallerACL{}, err
	}
	if m {
		return TaskCallerACL{CanManage: true, CanChangeStatus: true}, nil
	}
	if aid := t.AssigneeID(); aid != nil && aid.Uint() == callerID {
		r, ok, err := s.Projects.GetMemberRole(ctx, t.ProjectID(), user.ID(callerID))
		if err == nil && ok && r == project.RoleExecutor {
			return TaskCallerACL{CanManage: false, CanChangeStatus: true}, nil
		}
	}
	return TaskCallerACL{CanManage: false, CanChangeStatus: false}, nil
}

// List возвращает видимые задачи.
func (s *TaskService) List(ctx context.Context, callerID uint, role user.Role, projectID *uint, status *string) ([]*task.Task, error) {
	f := task.ListFilter{CallerID: user.ID(callerID), CallerIsSystem: user.IsSystemRole(role)}
	if !f.CallerIsSystem {
		vis, err := s.VisibleProjectIDs(ctx, callerID)
		if err != nil {
			return nil, err
		}
		f.VisibleProjectIDs = vis
	}
	if projectID != nil {
		pid := project.ID(*projectID)
		f.ProjectID = &pid
	}
	if status != nil && strings.TrimSpace(*status) != "" {
		st, err := task.ParseStatus(*status)
		if err != nil {
			return nil, ErrInvalidInput
		}
		f.Status = &st
	}
	return s.Tasks.ListVisible(ctx, f)
}

// Get возвращает задачу при доступе.
func (s *TaskService) Get(ctx context.Context, id, callerID uint, role user.Role) (*task.Task, error) {
	t, err := s.Tasks.FindByID(ctx, task.ID(id))
	if err != nil {
		return nil, err
	}
	if !s.canAccessTask(ctx, t, callerID, role) {
		return nil, ErrForbidden
	}
	return t, nil
}

// TaskCreate — вход создания задачи.
type TaskCreate struct {
	Title       string
	Description string
	ProjectID   uint
	SectionID   *uint
	Status      string
	Priority    string
	DueDate     *string
}

// Create создаёт задачу.
func (s *TaskService) Create(ctx context.Context, callerID uint, role user.Role, in TaskCreate) (*task.Task, error) {
	if in.ProjectID == 0 {
		return nil, ErrInvalidInput
	}
	ok, err := s.CanManageProjectTasks(ctx, in.ProjectID, callerID, role)
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
	if err := s.ensureSectionInProject(ctx, project.ID(in.ProjectID), secID); err != nil {
		return nil, err
	}
	stStr := strings.TrimSpace(in.Status)
	if stStr == "" {
		stStr = string(task.StatusTodo)
	}
	st, err := task.ParseStatus(stStr)
	if err != nil {
		return nil, ErrInvalidInput
	}
	prStr := strings.TrimSpace(in.Priority)
	if prStr == "" {
		prStr = string(task.PriorityMedium)
	}
	pr, err := task.ParsePriority(prStr)
	if err != nil {
		return nil, ErrInvalidInput
	}
	nextPos, err := s.Tasks.NextPosition(ctx, project.ID(in.ProjectID), secID)
	if err != nil {
		return nil, err
	}
	var due *time.Time
	if in.DueDate != nil {
		raw := strings.TrimSpace(*in.DueDate)
		if raw != "" {
			d, err := time.Parse("2006-01-02", raw)
			if err != nil {
				return nil, ErrInvalidInput
			}
			due = &d
		}
	}
	now := s.Clock()
	tr, err := task.NewTask(project.ID(in.ProjectID), secID, in.Title, in.Description, st, pr, nextPos, due, now)
	if err != nil {
		return nil, err
	}
	if err := s.Tasks.Save(ctx, tr); err != nil {
		return nil, err
	}
	return s.Tasks.FindByID(ctx, tr.ID())
}

// TaskUpdate — вход обновления.
type TaskUpdate struct {
	Title       *string
	Description *string
	Status      *string
	Priority    *string
	ProjectID   *uint
	DueDate     *string
}

func (s *TaskService) executorAssigneeStatusOnly(ctx context.Context, t *task.Task, userID uint, in TaskUpdate) bool {
	if in.Status == nil {
		return false
	}
	if in.Title != nil || in.Description != nil || in.Priority != nil || in.DueDate != nil || in.ProjectID != nil {
		return false
	}
	if t.AssigneeID() == nil || t.AssigneeID().Uint() != userID {
		return false
	}
	r, ok, err := s.Projects.GetMemberRole(ctx, t.ProjectID(), user.ID(userID))
	return err == nil && ok && r == project.RoleExecutor
}

// Update обновляет задачу с учётом ролей.
func (s *TaskService) Update(ctx context.Context, id, callerID uint, role user.Role, in TaskUpdate) (*task.Task, error) {
	t, err := s.Get(ctx, id, callerID, role)
	if err != nil {
		return nil, err
	}
	now := s.Clock()
	owner, err := s.CanManageProjectTasks(ctx, t.ProjectID().Uint(), callerID, role)
	if err != nil {
		return nil, err
	}
	if owner {
		var st *task.Status
		if in.Status != nil {
			p, err := task.ParseStatus(*in.Status)
			if err != nil {
				return nil, ErrInvalidInput
			}
			st = &p
		}
		var pr *task.Priority
		if in.Priority != nil {
			p, err := task.ParsePriority(*in.Priority)
			if err != nil {
				return nil, ErrInvalidInput
			}
			pr = &p
		}
		dueDateSet := in.DueDate != nil
		var duePtr *time.Time
		if dueDateSet {
			raw := strings.TrimSpace(*in.DueDate)
			if raw == "" {
				duePtr = nil
			} else {
				d, err := time.Parse("2006-01-02", raw)
				if err != nil {
					return nil, ErrInvalidInput
				}
				duePtr = &d
			}
		}
		if err := t.UpdateDetails(in.Title, in.Description, st, pr, dueDateSet, duePtr, now); err != nil {
			return nil, err
		}
		if in.ProjectID != nil {
			newPID := *in.ProjectID
			if newPID == 0 {
				return nil, ErrInvalidInput
			}
			if newPID != t.ProjectID().Uint() {
				ok, err := s.CanManageProjectTasks(ctx, newPID, callerID, role)
				if err != nil {
					return nil, err
				}
				if !ok {
					return nil, ErrForbidden
				}
				t.MoveToProject(project.ID(newPID), nil, t.Position(), now)
			}
		}
		if err := s.Tasks.Save(ctx, t); err != nil {
			return nil, err
		}
		return s.Tasks.FindByID(ctx, task.ID(id))
	}
	if s.executorAssigneeStatusOnly(ctx, t, callerID, in) {
		st, err := task.ParseStatus(*in.Status)
		if err != nil {
			return nil, ErrInvalidInput
		}
		if err := t.ChangeStatus(st, now); err != nil {
			return nil, err
		}
		if err := s.Tasks.Save(ctx, t); err != nil {
			return nil, err
		}
		return s.Tasks.FindByID(ctx, task.ID(id))
	}
	return nil, ErrForbidden
}

// Delete удаляет задачу и подзадачи.
func (s *TaskService) Delete(ctx context.Context, id, callerID uint, role user.Role) error {
	t, err := s.Get(ctx, id, callerID, role)
	if err != nil {
		return err
	}
	ok, err := s.CanManageProjectTasks(ctx, t.ProjectID().Uint(), callerID, role)
	if err != nil || !ok {
		if err == nil {
			err = ErrForbidden
		}
		return err
	}
	return s.Tasks.Delete(ctx, task.ID(id))
}

// Complete помечает задачу выполненной.
func (s *TaskService) Complete(ctx context.Context, id, callerID uint, role user.Role) (*task.Task, error) {
	t, err := s.Get(ctx, id, callerID, role)
	if err != nil {
		return nil, err
	}
	owner, err := s.CanManageProjectTasks(ctx, t.ProjectID().Uint(), callerID, role)
	if err != nil {
		return nil, err
	}
	assignee := t.AssigneeID() != nil && t.AssigneeID().Uint() == callerID
	if !owner && !assignee {
		return nil, ErrForbidden
	}
	if err := t.Complete(s.Clock()); err != nil {
		return nil, err
	}
	if err := s.Tasks.Save(ctx, t); err != nil {
		return nil, err
	}
	return s.Tasks.FindByID(ctx, task.ID(id))
}

// ListSubtasks возвращает подзадачи (копия слайса из агрегата).
func (s *TaskService) ListSubtasks(ctx context.Context, taskID, callerID uint, role user.Role) ([]*task.Subtask, error) {
	t, err := s.Get(ctx, taskID, callerID, role)
	if err != nil {
		return nil, err
	}
	src := t.Subtasks()
	out := make([]*task.Subtask, len(src))
	copy(out, src)
	return out, nil
}

// CreateSubtask добавляет подзадачу.
func (s *TaskService) CreateSubtask(ctx context.Context, taskID, callerID uint, role user.Role, title string) (*task.Subtask, error) {
	t, err := s.Get(ctx, taskID, callerID, role)
	if err != nil {
		return nil, err
	}
	ok, err := s.CanManageProjectTasks(ctx, t.ProjectID().Uint(), callerID, role)
	if err != nil {
		return nil, err
	}
	if !ok {
		return nil, ErrForbidden
	}
	st, err := t.AddSubtask(title, s.Clock())
	if err != nil {
		return nil, err
	}
	if err := s.Tasks.Save(ctx, t); err != nil {
		return nil, err
	}
	return st, nil
}

// SubtaskUpdate — вход обновления подзадачи.
type SubtaskUpdate struct {
	Title    *string
	Done     *bool
	Position *int
}

// UpdateSubtask обновляет подзадачу.
func (s *TaskService) UpdateSubtask(ctx context.Context, taskID, subtaskID, callerID uint, role user.Role, in SubtaskUpdate) (*task.Subtask, error) {
	t, err := s.Get(ctx, taskID, callerID, role)
	if err != nil {
		return nil, err
	}
	ok, err := s.CanManageProjectTasks(ctx, t.ProjectID().Uint(), callerID, role)
	if err != nil {
		return nil, err
	}
	if !ok {
		return nil, ErrForbidden
	}
	sid := task.SubtaskID(subtaskID)
	st := t.SubtaskByID(sid)
	if st == nil {
		return nil, task.ErrSubtaskNotFound
	}
	if in.Title != nil {
		if err := st.Rename(*in.Title, s.Clock()); err != nil {
			return nil, err
		}
	}
	if in.Done != nil {
		st.MarkDone(*in.Done, s.Clock())
	}
	if in.Position != nil {
		st.SetPosition(*in.Position, s.Clock())
	}
	t.Touch(s.Clock())
	if err := s.Tasks.Save(ctx, t); err != nil {
		return nil, err
	}
	return t.SubtaskByID(sid), nil
}

// ToggleSubtask переключает флаг done.
func (s *TaskService) ToggleSubtask(ctx context.Context, taskID, subtaskID, callerID uint, role user.Role) (*task.Subtask, error) {
	t, err := s.Get(ctx, taskID, callerID, role)
	if err != nil {
		return nil, err
	}
	isManager, err := s.CanManageProjectTasks(ctx, t.ProjectID().Uint(), callerID, role)
	if err != nil {
		return nil, err
	}
	isAssignee := t.AssigneeID() != nil && t.AssigneeID().Uint() == callerID
	if !isManager && !isAssignee {
		return nil, ErrForbidden
	}
	sid := task.SubtaskID(subtaskID)
	if err := t.ToggleSubtask(sid, s.Clock()); err != nil {
		return nil, err
	}
	if err := s.Tasks.Save(ctx, t); err != nil {
		return nil, err
	}
	return t.SubtaskByID(sid), nil
}

// DeleteSubtask удаляет подзадачу.
func (s *TaskService) DeleteSubtask(ctx context.Context, taskID, subtaskID, callerID uint, role user.Role) error {
	t, err := s.Get(ctx, taskID, callerID, role)
	if err != nil {
		return err
	}
	ok, err := s.CanManageProjectTasks(ctx, t.ProjectID().Uint(), callerID, role)
	if err != nil {
		return err
	}
	if !ok {
		return ErrForbidden
	}
	if err := t.RemoveSubtask(task.SubtaskID(subtaskID), s.Clock()); err != nil {
		return err
	}
	return s.Tasks.Save(ctx, t)
}
