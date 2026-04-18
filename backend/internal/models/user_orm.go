package models

import "strings"

// User — ORM-модель строки таблицы users для связей GORM (Preload) и отчётов.
// Доменный агрегат: internal/domain/user.
type User struct {
	ID           uint   `gorm:"primaryKey" json:"id"`
	Email        string `json:"email"`
	Name         string `json:"name"`
	LastName     string `json:"last_name"`
	FirstName    string `json:"first_name"`
	Patronymic   string `json:"patronymic"`
	Department   string `json:"department"`
	JobTitle     string `json:"job_title"`
	Phone        string `json:"phone"`
	Locale       string `json:"locale"`
	Role         string `gorm:"default:'user'" json:"role"`
	PasswordHash string `json:"-"`
}

// UserDisplayName — отображаемое имя для ORM-загрузки (отчёты, Preload).
func UserDisplayName(u *User) string {
	if u == nil {
		return ""
	}
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
