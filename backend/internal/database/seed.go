package database

import (
	"errors"
	"strings"

	"task-manager/backend/internal/models"
	"task-manager/backend/internal/utils"

	"gorm.io/gorm"
)

// EnsureDefaultAdmin creates an admin user if ADMIN_EMAIL/ADMIN_PASSWORD are set
// and no user with that email exists.
func EnsureDefaultAdmin(db *gorm.DB, email, password, name string) error {
	email = strings.TrimSpace(strings.ToLower(email))
	password = strings.TrimSpace(password)
	if email == "" || password == "" {
		return nil
	}

	var existing models.User
	err := db.Where("email = ?", email).First(&existing).Error
	if err == nil {
		return nil
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return err
	}

	hash, err := utils.HashPassword(password)
	if err != nil {
		return err
	}
	if strings.TrimSpace(name) == "" {
		name = "Admin"
	}

	return db.Create(&models.User{
		Email:        email,
		PasswordHash: hash,
		Name:         name,
		Role:         models.RoleAdmin,
	}).Error
}
