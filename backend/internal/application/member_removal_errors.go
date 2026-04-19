package application

import "errors"

// Ошибки удаления участника и переноса задач (ранее в services/member_service.go).
var (
	ErrTargetUserNotFound         = errors.New("user not found")
	ErrTargetNotProjectMember     = errors.New("transfer target must be a project member or owner")
	ErrCannotTransferToSelf       = errors.New("cannot transfer tasks to the member being removed")
	ErrInvalidTaskTransfer        = errors.New("task does not belong to the member being removed")
	ErrDuplicateTaskTransfer      = errors.New("duplicate task in transfer list")
	ErrCannotTransferToSameMember = errors.New("cannot assign task to the member being removed")
	ErrInvalidAssignee            = errors.New("assignee must be a project member or owner")
	ErrIncompleteTaskTransfer     = errors.New("all tasks must be reassigned before removing member")
)
