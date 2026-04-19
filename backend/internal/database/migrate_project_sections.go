package database

import (
	"gorm.io/gorm"
)

// migrateProjectSections runs before AutoMigrate.
//
// SQLite-only: inspects sqlite_master and uses ALTER TABLE … RENAME TO; other dialects no-op.
// Renames legacy task_sections → project_sections, clears note section refs,
// drops note_sections. Must run before SectionRecord targets project_sections.
func migrateProjectSections(db *gorm.DB) error {
	if db.Dialector.Name() != "sqlite" {
		return nil
	}
	var n int64
	if err := db.Raw("SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='task_sections'").Scan(&n).Error; err != nil {
		return err
	}
	if n == 0 {
		// Fresh DB or already migrated.
		return clearNoteSectionRefsAndDropLegacy(db)
	}

	var ps int64
	if err := db.Raw("SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='project_sections'").Scan(&ps).Error; err != nil {
		return err
	}
	if ps == 0 {
		if err := db.Exec("ALTER TABLE task_sections RENAME TO project_sections").Error; err != nil {
			return err
		}
		return clearNoteSectionRefsAndDropLegacy(db)
	}

	// Both tables exist (e.g. AutoMigrate ran on old path): merge rows from task_sections.
	if err := db.Exec("INSERT OR IGNORE INTO project_sections SELECT * FROM task_sections").Error; err != nil {
		return err
	}
	if err := db.Exec("DROP TABLE IF EXISTS task_sections").Error; err != nil {
		return err
	}
	return clearNoteSectionRefsAndDropLegacy(db)
}

func clearNoteSectionRefsAndDropLegacy(db *gorm.DB) error {
	_ = db.Exec("UPDATE notes SET section_id = NULL WHERE section_id IS NOT NULL").Error
	return db.Exec("DROP TABLE IF EXISTS note_sections").Error
}
