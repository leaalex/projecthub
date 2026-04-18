package services

import "errors"

// ErrInvalidInput — общая ошибка валидации для сервисов (раньше частично дублировалась в auth/user).
var ErrInvalidInput = errors.New("invalid input")
