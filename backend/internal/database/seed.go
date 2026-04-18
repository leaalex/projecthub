package database

import (
	"context"
	"errors"
	"strings"
	"time"

	"task-manager/backend/internal/domain/user"
	"task-manager/backend/internal/infrastructure/persistence/userstore"

	"gorm.io/gorm"
)

// EnsureDefaultAdmin создаёт пользователя-администратора, если переменные ADMIN_EMAIL/ADMIN_PASSWORD заданы
// и пользователя с таким email ещё не существует.
func EnsureDefaultAdmin(db *gorm.DB, email, password, name string) error {
	email = strings.TrimSpace(strings.ToLower(email))
	password = strings.TrimSpace(password)
	if email == "" || password == "" {
		return nil
	}

	var existing userstore.Record
	err := db.Where("email = ?", email).First(&existing).Error
	if err == nil {
		return nil
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return err
	}

	hash, err := user.HashPassword(password)
	if err != nil {
		return err
	}
	if strings.TrimSpace(name) == "" {
		name = "Admin"
	}
	e, err := user.NewEmail(email)
	if err != nil {
		return err
	}
	fn := user.FullName{Legacy: name}
	u, err := user.NewUser(e, hash, fn, user.RoleAdmin)
	if err != nil {
		return err
	}
	u.Touch(time.Now())
	repo := userstore.NewGormRepository(db)
	return repo.Save(context.Background(), u)
}
