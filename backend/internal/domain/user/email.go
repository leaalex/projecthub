package user

import (
	"net/mail"
	"strings"
)

// Email — нормализованный email (нижний регистр, trim).
type Email struct {
	v string
}

func NewEmail(raw string) (Email, error) {
	s := strings.TrimSpace(strings.ToLower(raw))
	if s == "" {
		return Email{}, ErrInvalidEmail
	}
	addr, err := mail.ParseAddress(s)
	if err != nil {
		return Email{}, ErrInvalidEmail
	}
	// ParseAddress может вернуть "Name <email@x>" — берём только адресную часть
	at := strings.LastIndex(addr.Address, "@")
	if at <= 0 || at == len(addr.Address)-1 {
		return Email{}, ErrInvalidEmail
	}
	return Email{v: addr.Address}, nil
}

func (e Email) String() string {
	return e.v
}
