package application

import "errors"

var (
	ErrInvalidCreds        = errors.New("invalid email or password")
	ErrInvalidInput        = errors.New("invalid input")
	ErrInvalidRefreshToken = errors.New("invalid refresh token")
)
