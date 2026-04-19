package user

import (
	"strings"
	"time"
)

// User — корень IAM-агрегата.
type User struct {
	id         ID
	email      Email
	name       FullName
	role       Role
	locale     Locale
	hash       PasswordHash
	department string
	jobTitle   string
	phone      string
	createdAt  time.Time
	updatedAt  time.Time
}

// NewUser создаёт нового пользователя (ещё без ID до сохранения в БД).
func NewUser(email Email, hash PasswordHash, name FullName, role Role) (*User, error) {
	if !role.IsValid() {
		return nil, ErrInvalidGlobalRole
	}
	n := name
	n.SyncLegacyName()
	loc := DefaultLocale()
	return &User{
		email:     email,
		name:      n,
		role:      role,
		locale:    loc,
		hash:      hash,
		createdAt: time.Time{},
		updatedAt: time.Time{},
	}, nil
}

// Reconstitute восстанавливает пользователя из хранилища (только для persistence / application).
func Reconstitute(
	id ID,
	email Email,
	name FullName,
	role Role,
	locale Locale,
	hash PasswordHash,
	department, jobTitle, phone string,
	createdAt, updatedAt time.Time,
) *User {
	return &User{
		id:         id,
		email:      email,
		name:       name,
		role:       role,
		locale:     locale,
		hash:       hash,
		department: department,
		jobTitle:   jobTitle,
		phone:      phone,
		createdAt:  createdAt,
		updatedAt:  updatedAt,
	}
}

// AssignID выставляет ID после INSERT (только persistence).
func (u *User) AssignID(id ID) {
	u.id = id
}

func (u *User) ID() ID                     { return u.id }
func (u *User) Email() Email               { return u.email }
func (u *User) Name() FullName             { return u.name }
func (u *User) Role() Role                 { return u.role }
func (u *User) Locale() Locale             { return u.locale }
func (u *User) PasswordHash() PasswordHash { return u.hash }
func (u *User) Department() string         { return u.department }
func (u *User) JobTitle() string           { return u.jobTitle }
func (u *User) Phone() string              { return u.phone }
func (u *User) CreatedAt() time.Time       { return u.createdAt }
func (u *User) UpdatedAt() time.Time       { return u.updatedAt }

func (u *User) ChangeEmail(e Email) {
	u.email = e
}

func (u *User) SetFullName(n FullName) {
	u.name = n
	u.name.SyncLegacyName()
}

func (u *User) SetDepartment(s string) {
	u.department = strings.TrimSpace(s)
}

func (u *User) SetJobTitle(s string) {
	u.jobTitle = strings.TrimSpace(s)
}

func (u *User) SetPhone(s string) {
	u.phone = strings.TrimSpace(s)
}

func (u *User) ChangeRole(r Role) error {
	if !r.IsValid() {
		return ErrInvalidGlobalRole
	}
	u.role = r
	return nil
}

func (u *User) ChangePassword(h PasswordHash) {
	u.hash = h
}

func (u *User) ChangeLocale(l Locale) {
	u.locale = l
}

func (u *User) Touch(now time.Time) {
	if u.createdAt.IsZero() {
		u.createdAt = now
	}
	u.updatedAt = now
}

// IsSystemRole — пакетная функция для совместимости с вызовами из сервисов.
func IsSystemRole(r Role) bool {
	return r.IsSystem()
}
