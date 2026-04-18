package user

import "strings"

// Locale — язык интерфейса пользователя.
type Locale struct {
	v string
}

func NewLocale(raw string) (Locale, error) {
	v := strings.ToLower(strings.TrimSpace(raw))
	switch v {
	case "ru", "en":
		return Locale{v: v}, nil
	default:
		return Locale{}, ErrInvalidLocale
	}
}

func DefaultLocale() Locale {
	return Locale{v: "ru"}
}

func (l Locale) String() string {
	return l.v
}
