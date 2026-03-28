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
	); err != nil {
		return nil, err
	}

	return db, nil
}
