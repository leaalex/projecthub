package database

import (
	"os"
	"path/filepath"

	"task-manager/backend/internal/models"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

// sqliteDSN appends driver options to reduce "database is locked" under concurrent writes.
func sqliteDSN(path string) string {
	return path + "?_busy_timeout=5000&_journal_mode=WAL"
}

func Open(databasePath string) (*gorm.DB, error) {
	dir := filepath.Dir(databasePath)
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return nil, err
	}

	db, err := gorm.Open(sqlite.Open(sqliteDSN(databasePath)), &gorm.Config{})
	if err != nil {
		return nil, err
	}

	sqlDB, err := db.DB()
	if err != nil {
		return nil, err
	}
	// SQLite: single writer; limit pool to avoid competing connections.
	sqlDB.SetMaxOpenConns(1)

	if err := db.AutoMigrate(
		&models.User{},
		&models.Project{},
		&models.ProjectMember{},
		&models.TaskSection{},
		&models.Task{},
		&models.Subtask{},
		&models.SavedReport{},
	); err != nil {
		return nil, err
	}

	// One-time migration of legacy global roles
	_ = db.Model(&models.User{}).Where("role = ?", "member").Update("role", string(models.RoleUser)).Error
	_ = db.Model(&models.User{}).Where("role = ?", "manager").Update("role", string(models.RoleCreator)).Error

	_ = db.Model(&models.Project{}).Where("kind IS NULL OR kind = ?", "").Update("kind", string(models.ProjectKindTeam)).Error

	return db, nil
}
