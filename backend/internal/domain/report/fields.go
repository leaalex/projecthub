package report

import "strings"

// Ключи полей отчёта (JSON / API).
const (
	FieldTitle       = "title"
	FieldDescription = "description"
	FieldStatus      = "status"
	FieldPriority    = "priority"
	FieldProject     = "project"
	FieldAssignee    = "assignee"
	FieldDueDate     = "due_date"
	FieldCreatedAt   = "created_at"
	FieldUpdatedAt   = "updated_at"
)

var allowedReportFields = map[string]bool{
	FieldTitle:       true,
	FieldDescription: true,
	FieldStatus:      true,
	FieldPriority:    true,
	FieldProject:     true,
	FieldAssignee:    true,
	FieldDueDate:     true,
	FieldCreatedAt:   true,
	FieldUpdatedAt:   true,
}

var defaultReportFields = []string{
	FieldTitle,
	FieldDescription,
	FieldStatus,
	FieldPriority,
	FieldProject,
	FieldAssignee,
	FieldDueDate,
	FieldCreatedAt,
	FieldUpdatedAt,
}

// NormalizeFields возвращает отфильтрованный упорядоченный список полей.
func NormalizeFields(fields []string) []string {
	if len(fields) == 0 {
		out := make([]string, len(defaultReportFields))
		copy(out, defaultReportFields)
		return out
	}
	seen := make(map[string]bool)
	var out []string
	for _, f := range fields {
		f = strings.TrimSpace(strings.ToLower(f))
		if !allowedReportFields[f] || seen[f] {
			continue
		}
		seen[f] = true
		out = append(out, f)
	}
	if len(out) == 0 {
		out = append(out, defaultReportFields...)
	}
	return out
}

// FieldHeader — заголовок колонки для экспорта.
func FieldHeader(key string) string {
	switch key {
	case FieldTitle:
		return "Title"
	case FieldDescription:
		return "Description"
	case FieldStatus:
		return "Status"
	case FieldPriority:
		return "Priority"
	case FieldProject:
		return "Project"
	case FieldAssignee:
		return "Assignee"
	case FieldDueDate:
		return "Due date"
	case FieldCreatedAt:
		return "Created at"
	case FieldUpdatedAt:
		return "Updated at"
	default:
		return key
	}
}
