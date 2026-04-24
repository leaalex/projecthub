package task

import "errors"

var (
	ErrTaskNotFound          = errors.New("task not found")
	ErrSubtaskNotFound       = errors.New("subtask not found")
	ErrInvalidSubtaskReorder = errors.New("invalid subtask reorder")
	ErrInvalidTitle          = errors.New("invalid task title")
	ErrInvalidStatus         = errors.New("invalid task status")
	ErrInvalidPriority       = errors.New("invalid task priority")
	ErrTaskSectionNotFound   = errors.New("task section not found")
)
