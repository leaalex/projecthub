package database

import (
	"os"
	"path/filepath"

	"task-manager/backend/internal/domain/project"
	"task-manager/backend/internal/domain/user"
	"task-manager/backend/internal/infrastructure/persistence/notestore"
	"task-manager/backend/internal/infrastructure/persistence/projectstore"
	"task-manager/backend/internal/infrastructure/persistence/reportstore"
	"task-manager/backend/internal/infrastructure/persistence/sessionstore"
	"task-manager/backend/internal/infrastructure/persistence/taskstore"
	"task-manager/backend/internal/infrastructure/persistence/userstore"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

// sqliteDSN добавляет параметры драйвера:
//   - _foreign_keys=on  — включает проверку внешних ключей (FK), чтобы ON DELETE CASCADE работал
//   - _busy_timeout     — снижает количество ошибок «database is locked» при параллельной записи
//   - _journal_mode=WAL — улучшает параллелизм чтения
func sqliteDSN(path string) string {
	return path + "?_foreign_keys=on&_busy_timeout=5000&_journal_mode=WAL"
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
	// SQLite: одиночный писатель; ограничиваем пул, чтобы избежать конкурирующих соединений.
	sqlDB.SetMaxOpenConns(1)

	if err := db.AutoMigrate(
		&userstore.Record{},
		&sessionstore.Record{},
		&projectstore.ProjectRecord{},
		&projectstore.MemberRecord{},
		&projectstore.SectionRecord{},
		&projectstore.NoteSectionRecord{},
		&taskstore.TaskRecord{},
		&taskstore.SubtaskRecord{},
		&notestore.NoteRecord{},
		&notestore.NoteTaskLinkRecord{},
		&reportstore.SavedReportRecord{},
	); err != nil {
		return nil, err
	}

	// Одноразовая миграция устаревших глобальных ролей
	_ = db.Model(&userstore.Record{}).Where("role = ?", "member").Update("role", string(user.RoleUser)).Error
	_ = db.Model(&userstore.Record{}).Where("role = ?", "manager").Update("role", string(user.RoleCreator)).Error

	_ = db.Model(&projectstore.ProjectRecord{}).Where("kind IS NULL OR kind = ?", "").Update("kind", string(project.KindTeam)).Error

	return db, nil
}
