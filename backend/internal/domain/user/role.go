package user

import "strings"

// Role — глобальная роль пользователя в системе.
type Role string

const (
	RoleAdmin   Role = "admin"
	RoleStaff   Role = "staff"
	RoleCreator Role = "creator"
	RoleUser    Role = "user"
)

// ParseRole нормализует устаревшие значения member/manager.
func ParseRole(s string) (Role, error) {
	r := Role(strings.TrimSpace(strings.ToLower(s)))
	switch r {
	case "member":
		return RoleUser, nil
	case "manager":
		return RoleCreator, nil
	case RoleAdmin, RoleStaff, RoleCreator, RoleUser, "":
		if r == "" {
			return RoleUser, nil
		}
		return r, nil
	default:
		return "", ErrInvalidGlobalRole
	}
}

// IsValid возвращает true, если роль — одна из известных системных ролей.
func (r Role) IsValid() bool {
	switch r {
	case RoleAdmin, RoleStaff, RoleCreator, RoleUser:
		return true
	default:
		return false
	}
}

// IsSystem возвращает true для ролей с полным доступом вне проектов.
func (r Role) IsSystem() bool {
	return r == RoleAdmin || r == RoleStaff
}

func (r Role) String() string {
	return string(r)
}
