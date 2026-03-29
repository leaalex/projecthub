package models

import (
	"strings"
	"time"
)

type Role string

const (
	RoleAdmin   Role = "admin"
	RoleStaff   Role = "staff"
	RoleCreator Role = "creator"
	RoleUser    Role = "user"
)

type User struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	Email        string    `gorm:"uniqueIndex;not null" json:"email"`
	PasswordHash string    `gorm:"not null" json:"-"`
	Name         string    `json:"name"`
	LastName     string    `json:"last_name"`
	FirstName    string    `json:"first_name"`
	Patronymic   string    `json:"patronymic"`
	Department   string    `json:"department"`
	JobTitle     string    `json:"job_title"`
	Phone        string    `json:"phone"`
	Role         Role      `gorm:"default:'user'" json:"role"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// UserDisplayName returns "Фамилия Имя Отчество" when any part is set, otherwise legacy Name.
func UserDisplayName(u *User) string {
	parts := make([]string, 0, 3)
	for _, s := range []string{
		strings.TrimSpace(u.LastName),
		strings.TrimSpace(u.FirstName),
		strings.TrimSpace(u.Patronymic),
	} {
		if s != "" {
			parts = append(parts, s)
		}
	}
	if len(parts) > 0 {
		return strings.Join(parts, " ")
	}
	return strings.TrimSpace(u.Name)
}

// SyncNameFromFIO sets Name to UserDisplayName (keeps legacy Name when FIO empty).
func SyncNameFromFIO(u *User) {
	u.Name = UserDisplayName(u)
}

// IsSystemRole is true for roles that bypass normal project/task scoping (full visibility).
func IsSystemRole(r Role) bool {
	return r == RoleAdmin || r == RoleStaff
}
