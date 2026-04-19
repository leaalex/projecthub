package note

import "errors"

var (
	ErrNoteNotFound      = errors.New("note not found")
	ErrTitleRequired     = errors.New("note title is required")
	ErrTaskOtherProject  = errors.New("task belongs to a different project")
	ErrLinkAlreadyExists = errors.New("link already exists")
)
