package application

import "errors"

var (
	// ErrInvalidCreds — неверный email или пароль при входе / смене пароля.
	ErrInvalidCreds = errors.New("invalid email or password")
	// ErrInvalidInput — общая ошибка валидации прикладных сценариев.
	ErrInvalidInput = errors.New("invalid input")
	// ErrInvalidRefreshToken — refresh-токен отсутствует, истёк или отозван.
	ErrInvalidRefreshToken = errors.New("invalid refresh token")
	// ErrForbidden — нет прав на операцию.
	ErrForbidden = errors.New("forbidden")
)
