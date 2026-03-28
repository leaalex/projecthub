package models

import "time"

// SavedReport is a generated export file stored on disk (metadata in DB).
type SavedReport struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	UserID      uint      `gorm:"not null;index" json:"user_id"`
	StorageKey  string    `gorm:"not null;size:160;uniqueIndex" json:"-"`
	DisplayName string    `gorm:"not null;size:255" json:"display_name"`
	Format      string    `gorm:"not null;size:8" json:"format"`
	SizeBytes   int64     `gorm:"not null" json:"size_bytes"`
	FiltersJSON string    `gorm:"type:text" json:"-"`
	CreatedAt   time.Time `json:"created_at"`
}
