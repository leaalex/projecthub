package task

import "strings"

// Status — значимый объект статуса задачи.
type Status string

const (
	StatusTodo       Status = "todo"
	StatusInProgress Status = "in_progress"
	StatusReview     Status = "review"
	StatusDone       Status = "done"
)

// ParseStatus парсит строку в Status.
func ParseStatus(s string) (Status, error) {
	st := Status(strings.TrimSpace(strings.ToLower(s)))
	switch st {
	case StatusTodo, StatusInProgress, StatusReview, StatusDone:
		return st, nil
	default:
		return "", ErrInvalidStatus
	}
}

func (s Status) String() string { return string(s) }

// IsValid сообщает, задан ли известный статус.
func (s Status) IsValid() bool {
	switch s {
	case StatusTodo, StatusInProgress, StatusReview, StatusDone:
		return true
	default:
		return false
	}
}
