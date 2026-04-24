package application_test

import (
	"context"
	"errors"
	"sync"
	"testing"
	"time"

	"task-manager/backend/internal/application"
	"task-manager/backend/internal/domain/project"
	"task-manager/backend/internal/domain/task"
	"task-manager/backend/internal/domain/user"
)

// memTasks — минимальный in-memory task.Repository.
type memTasks struct {
	mu          sync.Mutex
	byID        map[uint]*task.Task
	softDeleted map[uint]struct{}
	next        uint
}

func newMemTasks() *memTasks {
	return &memTasks{byID: map[uint]*task.Task{}, softDeleted: map[uint]struct{}{}}
}

func (m *memTasks) FindByID(ctx context.Context, id task.ID) (*task.Task, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	t, ok := m.byID[id.Uint()]
	if !ok {
		return nil, task.ErrTaskNotFound
	}
	if _, del := m.softDeleted[id.Uint()]; del {
		return nil, task.ErrTaskNotFound
	}
	return t, nil
}

func (m *memTasks) FindByIDUnscoped(ctx context.Context, id task.ID) (*task.Task, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	t, ok := m.byID[id.Uint()]
	if !ok {
		return nil, task.ErrTaskNotFound
	}
	return t, nil
}

func (m *memTasks) Save(ctx context.Context, t *task.Task) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	if t.ID().Uint() == 0 {
		m.next++
		t.AssignID(task.ID(m.next))
	}
	m.byID[t.ID().Uint()] = t
	return nil
}

func (m *memTasks) Delete(ctx context.Context, id task.ID) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	if _, ok := m.byID[id.Uint()]; !ok {
		return task.ErrTaskNotFound
	}
	m.softDeleted[id.Uint()] = struct{}{}
	return nil
}

func (m *memTasks) Restore(ctx context.Context, id task.ID) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	delete(m.softDeleted, id.Uint())
	return nil
}

func (m *memTasks) HardDelete(ctx context.Context, id task.ID) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	delete(m.byID, id.Uint())
	delete(m.softDeleted, id.Uint())
	return nil
}

func (m *memTasks) ListDeletedByProject(ctx context.Context, projectID project.ID) ([]*task.Task, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	var out []*task.Task
	for id, tk := range m.byID {
		if tk.ProjectID() != projectID {
			continue
		}
		if _, del := m.softDeleted[id]; del {
			out = append(out, tk)
		}
	}
	return out, nil
}

func (m *memTasks) FindDeletedByIDInProject(ctx context.Context, projectID project.ID, id task.ID) (*task.Task, error) {
	list, err := m.ListDeletedByProject(ctx, projectID)
	if err != nil {
		return nil, err
	}
	for _, tk := range list {
		if tk.ID() == id {
			return tk, nil
		}
	}
	return nil, task.ErrTaskNotFound
}

func (m *memTasks) DeleteByProject(ctx context.Context, projectID project.ID) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	for id, tk := range m.byID {
		if tk.ProjectID() == projectID {
			delete(m.byID, id)
			delete(m.softDeleted, id)
		}
	}
	return nil
}

func (m *memTasks) ListVisible(ctx context.Context, filter task.ListFilter) ([]*task.Task, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	var out []*task.Task
	for id, tk := range m.byID {
		if _, del := m.softDeleted[id]; del {
			continue
		}
		if filter.ProjectID != nil && tk.ProjectID() != *filter.ProjectID {
			continue
		}
		out = append(out, tk)
	}
	return out, nil
}

func (m *memTasks) NextPosition(ctx context.Context, projectID project.ID, sectionID *project.SectionID) (int, error) {
	return 1, nil
}

func (m *memTasks) ListByAssignee(ctx context.Context, projectID project.ID, assigneeID user.ID) ([]*task.Task, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	var out []*task.Task
	for id, tk := range m.byID {
		if _, del := m.softDeleted[id]; del {
			continue
		}
		if tk.ProjectID() != projectID {
			continue
		}
		if aid := tk.AssigneeID(); aid == nil || *aid != assigneeID {
			continue
		}
		out = append(out, tk)
	}
	return out, nil
}

func (m *memTasks) ReassignByAssignee(ctx context.Context, projectID project.ID, oldAssignee user.ID, newAssignee *user.ID) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	now := time.Now()
	for id, tk := range m.byID {
		if _, del := m.softDeleted[id]; del {
			continue
		}
		if tk.ProjectID() != projectID {
			continue
		}
		if aid := tk.AssigneeID(); aid == nil || *aid != oldAssignee {
			continue
		}
		if newAssignee == nil {
			tk.Unassign(now)
		} else {
			nid := *newAssignee
			tk.Assign(&nid, now)
		}
	}
	return nil
}

func (m *memTasks) ReassignOne(ctx context.Context, id task.ID, projectID project.ID, newAssignee *user.ID) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	tk, ok := m.byID[id.Uint()]
	if !ok {
		return task.ErrTaskNotFound
	}
	if _, del := m.softDeleted[id.Uint()]; del {
		return task.ErrTaskNotFound
	}
	if tk.ProjectID() != projectID {
		// Как SQL UPDATE с несовпадением project_id: 0 строк, без ошибки.
		return nil
	}
	now := time.Now()
	if newAssignee == nil {
		tk.Unassign(now)
	} else {
		nid := *newAssignee
		tk.Assign(&nid, now)
	}
	return nil
}

func TestTaskService_Create_forbiddenWithoutManage(t *testing.T) {
	memP := newMemProjects()
	memT := newMemTasks()
	memU := newMemUsers()
	svc := application.NewTaskService(memT, memP, memU)

	p, err := project.NewProject(user.ID(1), user.RoleCreator, "P", "", project.KindTeam)
	if err != nil {
		t.Fatal(err)
	}
	p.Touch(time.Now())
	if err := memP.Save(context.Background(), p); err != nil {
		t.Fatal(err)
	}

	_, err = svc.Create(context.Background(), 2, user.RoleUser, application.TaskCreate{
		Title:     "x",
		ProjectID: p.ID().Uint(),
	})
	if err == nil {
		t.Fatal("expected error")
	}
}

func TestTaskService_VisibleProjectIDs_union(t *testing.T) {
	memP := newMemProjects()
	memT := newMemTasks()
	memU := newMemUsers()
	svc := application.NewTaskService(memT, memP, memU)

	p1, _ := project.NewProject(user.ID(1), user.RoleCreator, "A", "", project.KindTeam)
	p1.Touch(time.Now())
	_ = memP.Save(context.Background(), p1)
	p2, _ := project.NewProject(user.ID(2), user.RoleCreator, "B", "", project.KindTeam)
	p2.Touch(time.Now())
	_, _ = p2.AddMember(user.ID(1), project.RoleExecutor, time.Now())
	_ = memP.Save(context.Background(), p2)

	ids, err := svc.VisibleProjectIDs(context.Background(), 1)
	if err != nil {
		t.Fatal(err)
	}
	if len(ids) != 2 {
		t.Fatalf("got %v", ids)
	}
}

func TestTaskService_ReorderSubtasks(t *testing.T) {
	memP := newMemProjects()
	memT := newMemTasks()
	memU := newMemUsers()
	svc := application.NewTaskService(memT, memP, memU)

	p, err := project.NewProject(user.ID(1), user.RoleCreator, "P", "", project.KindTeam)
	if err != nil {
		t.Fatal(err)
	}
	p.Touch(time.Now())
	if err := memP.Save(context.Background(), p); err != nil {
		t.Fatal(err)
	}

	now := time.Now()
	st1 := task.ReconstituteSubtask(task.SubtaskID(1), "A", false, 1, now, now)
	st2 := task.ReconstituteSubtask(task.SubtaskID(2), "B", false, 2, now, now)
	st3 := task.ReconstituteSubtask(task.SubtaskID(3), "C", false, 3, now, now)
	tr := task.Reconstitute(
		task.ID(1),
		p.ID(),
		nil,
		nil,
		"T",
		"",
		task.StatusTodo,
		task.PriorityMedium,
		1,
		nil,
		[]*task.Subtask{st1, st2, st3},
		now,
		now,
	)
	if err := memT.Save(context.Background(), tr); err != nil {
		t.Fatal(err)
	}

	if err := svc.ReorderSubtasks(context.Background(), 1, 1, user.RoleUser, []uint{3, 1, 2}); err != nil {
		t.Fatal(err)
	}

	t2, err := svc.Get(context.Background(), 1, 1, user.RoleUser)
	if err != nil {
		t.Fatal(err)
	}
	if t2.SubtaskByID(task.SubtaskID(3)).Position() != 1 ||
		t2.SubtaskByID(task.SubtaskID(1)).Position() != 2 ||
		t2.SubtaskByID(task.SubtaskID(2)).Position() != 3 {
		t.Fatalf("positions: %d %d %d",
			t2.SubtaskByID(task.SubtaskID(3)).Position(),
			t2.SubtaskByID(task.SubtaskID(1)).Position(),
			t2.SubtaskByID(task.SubtaskID(2)).Position())
	}
}

func TestTaskService_ReorderSubtasks_forbidden(t *testing.T) {
	memP := newMemProjects()
	memT := newMemTasks()
	memU := newMemUsers()
	svc := application.NewTaskService(memT, memP, memU)

	p, err := project.NewProject(user.ID(1), user.RoleCreator, "P", "", project.KindTeam)
	if err != nil {
		t.Fatal(err)
	}
	p.Touch(time.Now())
	if err := memP.Save(context.Background(), p); err != nil {
		t.Fatal(err)
	}

	now := time.Now()
	st1 := task.ReconstituteSubtask(task.SubtaskID(1), "A", false, 1, now, now)
	st2 := task.ReconstituteSubtask(task.SubtaskID(2), "B", false, 2, now, now)
	tr := task.Reconstitute(
		task.ID(1),
		p.ID(),
		nil,
		nil,
		"T",
		"",
		task.StatusTodo,
		task.PriorityMedium,
		1,
		nil,
		[]*task.Subtask{st1, st2},
		now,
		now,
	)
	if err := memT.Save(context.Background(), tr); err != nil {
		t.Fatal(err)
	}

	err = svc.ReorderSubtasks(context.Background(), 1, 2, user.RoleUser, []uint{1, 2})
	if err == nil {
		t.Fatal("expected error")
	}
	if !errors.Is(err, application.ErrForbidden) {
		t.Fatalf("got %v", err)
	}
}
