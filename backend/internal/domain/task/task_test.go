package task

import (
	"testing"
	"time"

	"task-manager/backend/internal/domain/project"
	"task-manager/backend/internal/domain/user"
)

func TestNewTask_InvalidTitle(t *testing.T) {
	now := time.Now()
	_, err := NewTask(project.ID(1), nil, "  ", "", StatusTodo, PriorityMedium, 1, nil, now)
	if err != ErrInvalidTitle {
		t.Fatalf("got %v", err)
	}
}

func TestTaskSubtasks(t *testing.T) {
	now := time.Now()
	tr, err := NewTask(project.ID(1), nil, "T", "", StatusTodo, PriorityMedium, 1, nil, now)
	if err != nil {
		t.Fatal(err)
	}
	st, err := tr.AddSubtask("A", now)
	if err != nil {
		t.Fatal(err)
	}
	st2, err := tr.AddSubtask("B", now)
	if err != nil {
		t.Fatal(err)
	}
	if st.Position() != 1 || st2.Position() != 2 {
		t.Fatalf("positions %d %d", st.Position(), st2.Position())
	}
	st.AssignID(SubtaskID(10))
	if err := tr.SetSubtaskPosition(SubtaskID(10), 5, now); err != nil {
		t.Fatal(err)
	}
	if tr.findSubtask(SubtaskID(10)).Position() != 5 {
		t.Fatal("position")
	}
}

func TestTask_ReorderSubtasks_invalid(t *testing.T) {
	now := time.Now()
	tr, err := NewTask(project.ID(1), nil, "T", "", StatusTodo, PriorityMedium, 1, nil, now)
	if err != nil {
		t.Fatal(err)
	}
	st1, _ := tr.AddSubtask("A", now)
	st2, _ := tr.AddSubtask("B", now)
	st1.AssignID(SubtaskID(1))
	st2.AssignID(SubtaskID(2))

	if err := tr.ReorderSubtasks(nil, now); err != ErrInvalidSubtaskReorder {
		t.Fatalf("empty order: got %v want ErrInvalidSubtaskReorder", err)
	}
	if err := tr.ReorderSubtasks([]SubtaskID{SubtaskID(1)}, now); err != ErrInvalidSubtaskReorder {
		t.Fatalf("incomplete: got %v", err)
	}
	if err := tr.ReorderSubtasks([]SubtaskID{SubtaskID(10), SubtaskID(2)}, now); err != ErrInvalidSubtaskReorder {
		t.Fatalf("unknown id: got %v", err)
	}
	if err := tr.ReorderSubtasks([]SubtaskID{SubtaskID(2), SubtaskID(2)}, now); err != ErrInvalidSubtaskReorder {
		t.Fatalf("dup: got %v", err)
	}
}

func TestTask_ReorderSubtasks_happy(t *testing.T) {
	now := time.Now()
	tr, err := NewTask(project.ID(1), nil, "T", "", StatusTodo, PriorityMedium, 1, nil, now)
	if err != nil {
		t.Fatal(err)
	}
	st1, _ := tr.AddSubtask("A", now)
	st2, _ := tr.AddSubtask("B", now)
	st1.AssignID(SubtaskID(1))
	st2.AssignID(SubtaskID(2))
	if err := tr.ReorderSubtasks([]SubtaskID{SubtaskID(2), SubtaskID(1)}, now); err != nil {
		t.Fatal(err)
	}
	if tr.SubtaskByID(SubtaskID(1)).Position() != 2 || tr.SubtaskByID(SubtaskID(2)).Position() != 1 {
		t.Fatalf("positions: %d %d", tr.SubtaskByID(SubtaskID(2)).Position(), tr.SubtaskByID(SubtaskID(1)).Position())
	}
}

func TestTaskComplete(t *testing.T) {
	now := time.Now()
	tr, _ := NewTask(project.ID(1), nil, "T", "", StatusTodo, PriorityMedium, 1, nil, now)
	if err := tr.Complete(now); err != nil {
		t.Fatal(err)
	}
	if tr.Status() != StatusDone {
		t.Fatal(tr.Status())
	}
}

func TestMoveToProjectClearsSectionWhenNil(t *testing.T) {
	now := time.Now()
	sec := project.SectionID(9)
	tr := Reconstitute(1, project.ID(1), &sec, nil, "x", "", StatusTodo, PriorityMedium, 1, nil, nil, now, now)
	tr.MoveToProject(project.ID(2), nil, 3, now)
	if tr.SectionID() != nil {
		t.Fatal("expected nil section")
	}
	if tr.ProjectID() != project.ID(2) || tr.Position() != 3 {
		t.Fatal(tr.ProjectID(), tr.Position())
	}
}

func TestAssign(t *testing.T) {
	now := time.Now()
	u := user.ID(42)
	tr, _ := NewTask(project.ID(1), nil, "T", "", StatusTodo, PriorityMedium, 1, nil, now)
	tr.Assign(&u, now)
	if tr.AssigneeID() == nil || *tr.AssigneeID() != u {
		t.Fatal("assignee")
	}
	tr.Unassign(now)
	if tr.AssigneeID() != nil {
		t.Fatal("expected unassign")
	}
}
