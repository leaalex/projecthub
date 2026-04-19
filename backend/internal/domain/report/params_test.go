package report

import (
	"testing"
	"time"

	"task-manager/backend/internal/domain/task"
)

func TestGenerateParams_Validate_ok(t *testing.T) {
	p := GenerateParams{
		Format:     FormatCSV,
		GroupBy:    GroupByProject,
		PDFLayout:  PDFLayoutTable,
		Statuses:   []task.Status{task.StatusTodo},
		Priorities: []task.Priority{task.PriorityMedium},
	}
	if err := p.Validate(); err != nil {
		t.Fatal(err)
	}
}

func TestGenerateParams_Validate_badStatus(t *testing.T) {
	p := GenerateParams{
		Format:    FormatCSV,
		GroupBy:   GroupByNone,
		PDFLayout: PDFLayoutTable,
		Statuses:  []task.Status{"nope"},
	}
	if err := p.Validate(); err != ErrInvalidFields {
		t.Fatalf("got %v", err)
	}
}

func TestWeekWindow(t *testing.T) {
	// Wednesday 2026-04-15 UTC
	ref := time.Date(2026, 4, 15, 12, 0, 0, 0, time.UTC)
	start, end := WeekWindow(ref)
	if start.Weekday() != time.Monday {
		t.Fatalf("start weekday %v", start.Weekday())
	}
	if !end.After(start) {
		t.Fatal("end")
	}
}
