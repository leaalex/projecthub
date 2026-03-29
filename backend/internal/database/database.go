package database

import (
	"os"
	"path/filepath"

	"task-manager/backend/internal/models"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func Open(databasePath string) (*gorm.DB, error) {
	dir := filepath.Dir(databasePath)
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return nil, err
	}

	db, err := gorm.Open(sqlite.Open(databasePath), &gorm.Config{})
	if err != nil {
		return nil, err
	}

	if err := db.AutoMigrate(
		&models.User{},
		&models.Project{},
		&models.Task{},
		&models.Subtask{},
		&models.SavedReport{},
	); err != nil {
		return nil, err
	}

	// One-time migration of legacy global roles
	_ = db.Model(&models.User{}).Where("role = ?", "member").Update("role", string(models.RoleUser)).Error
	_ = db.Model(&models.User{}).Where("role = ?", "manager").Update("role", string(models.RoleCreator)).Error

	return db, nil
}
