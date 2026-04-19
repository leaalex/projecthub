package task

import "strings"

// Priority — значимый объект приоритета задачи.
type Priority string

const (
	PriorityLow      Priority = "low"
	PriorityMedium   Priority = "medium"
	PriorityHigh     Priority = "high"
	PriorityCritical Priority = "critical"
)

// ParsePriority парсит строку в Priority.
func ParsePriority(s string) (Priority, error) {
	p := Priority(strings.TrimSpace(strings.ToLower(s)))
	switch p {
	case PriorityLow, PriorityMedium, PriorityHigh, PriorityCritical:
		return p, nil
	default:
		return "", ErrInvalidPriority
	}
}

func (p Priority) String() string { return string(p) }

// IsValid сообщает, задан ли известный приоритет.
func (p Priority) IsValid() bool {
	switch p {
	case PriorityLow, PriorityMedium, PriorityHigh, PriorityCritical:
		return true
	default:
		return false
	}
}
