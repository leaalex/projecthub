package report

import (
	"time"

	"task-manager/backend/internal/domain/task"
)

// TaskProjection — read-модель строки задачи для отчётов.
type TaskProjection struct {
	ID           uint
	Title        string
	Description  string
	Status       task.Status
	Priority     task.Priority
	ProjectName  string
	AssigneeName string
	DueDate      *time.Time
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

func formatTimePtr(p *time.Time) string {
	if p == nil {
		return ""
	}
	return p.UTC().Format(time.RFC3339)
}

func formatTime(t time.Time) string {
	return t.UTC().Format(time.RFC3339)
}

// Cell возвращает строковое значение поля для экспорта.
func (t *TaskProjection) Cell(field string) string {
	switch field {
	case FieldTitle:
		return t.Title
	case FieldDescription:
		return t.Description
	case FieldStatus:
		return t.Status.String()
	case FieldPriority:
		return t.Priority.String()
	case FieldProject:
		return t.ProjectName
	case FieldAssignee:
		return t.AssigneeName
	case FieldDueDate:
		return formatTimePtr(t.DueDate)
	case FieldCreatedAt:
		return formatTime(t.CreatedAt)
	case FieldUpdatedAt:
		return formatTime(t.UpdatedAt)
	default:
		return ""
	}
}

// GroupLabel — метка группы для groupBy.
func (t *TaskProjection) GroupLabel(groupBy GroupBy) string {
	switch groupBy {
	case GroupByProject:
		return t.ProjectName
	case GroupByStatus:
		return t.Status.String()
	case GroupByPriority:
		return t.Priority.String()
	case GroupByAssignee:
		return t.AssigneeName
	default:
		return ""
	}
}
