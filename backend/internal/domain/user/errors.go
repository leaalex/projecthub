package user

import "errors"

var (
	ErrUserNotFound         = errors.New("user not found")
	ErrEmailTaken           = errors.New("email already registered")
	ErrInvalidGlobalRole    = errors.New("invalid global role")
	ErrCannotDeleteSelf     = errors.New("cannot delete own account")
	ErrCannotChangeOwnRole  = errors.New("cannot change own global role")
	ErrInvalidEmail         = errors.New("invalid email")
	ErrInvalidLocale        = errors.New("invalid locale")
	ErrInvalidPassword      = errors.New("invalid password")
)
