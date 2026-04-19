package report

import (
	"testing"
	"time"

	"task-manager/backend/internal/domain/task"
)

func TestTaskProjection_Cell(t *testing.T) {
	due := time.Date(2026, 1, 2, 0, 0, 0, 0, time.UTC)
	tp := TaskProjection{
		Title:        "T",
		Status:       task.StatusDone,
		Priority:     task.PriorityHigh,
		ProjectName:  "P",
		AssigneeName: "Alice",
		DueDate:      &due,
	}
	if tp.Cell(FieldTitle) != "T" {
		t.Fatal()
	}
	if tp.GroupLabel(GroupByAssignee) != "Alice" {
		t.Fatal()
	}
}
