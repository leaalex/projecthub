package application

import "errors"

// ErrAssigneeNotProjectMember — назначаемый не является владельцем или участником проекта.
var ErrAssigneeNotProjectMember = errors.New("assignee must be project owner or member")
