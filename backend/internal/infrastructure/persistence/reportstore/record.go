package reportstore

import "time"

// SavedReportRecord — строка таблицы saved_reports.
type SavedReportRecord struct {
	ID          uint      `gorm:"primaryKey"`
	UserID      uint      `gorm:"not null;index"`
	StorageKey  string    `gorm:"not null;size:160;uniqueIndex"`
	DisplayName string    `gorm:"not null;size:255"`
	Format      string    `gorm:"not null;size:8"`
	SizeBytes   int64     `gorm:"not null"`
	FiltersJSON string    `gorm:"type:text"`
	CreatedAt   time.Time `gorm:"autoCreateTime"`
}

func (SavedReportRecord) TableName() string { return "saved_reports" }
