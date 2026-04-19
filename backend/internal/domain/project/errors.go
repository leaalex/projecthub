package project

import "errors"

var (
	ErrProjectNotFound       = errors.New("project not found")
	ErrForbidden             = errors.New("forbidden")
	ErrAlreadyMember         = errors.New("user is already a project member")
	ErrNotMember             = errors.New("user is not a member of this project")
	ErrCannotRemoveOwner     = errors.New("cannot remove project owner")
	ErrPersonalNoMembers     = errors.New("personal projects do not support members")
	ErrTeamProjectNotAllowed = errors.New("team projects require creator role or above")
	ErrSectionNotFound       = errors.New("section not found")
	ErrInvalidReorder        = errors.New("invalid section reorder")
	ErrInvalidMemberRole     = errors.New("invalid project role")
	ErrInvalidSectionName    = errors.New("invalid section name")
	ErrInvalidProjectName    = errors.New("invalid project name")
	// ErrOwnershipUnchanged — попытка передать владение тому же пользователю.
	ErrOwnershipUnchanged = errors.New("invalid ownership transfer")
)
