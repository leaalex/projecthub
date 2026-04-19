package notestore

import (
	"time"

	"gorm.io/gorm"
)

// NoteRecord — строка таблицы notes.
type NoteRecord struct {
	ID        uint           `gorm:"primaryKey"`
	ProjectID uint           `gorm:"not null;index"`
	SectionID *uint          `gorm:"index"`
	AuthorID  uint           `gorm:"not null;index"`
	Title     string         `gorm:"not null"`
	Body      string         `gorm:"type:text"`
	Position  int            `gorm:"not null;default:0;index"`
	DeletedAt gorm.DeletedAt `gorm:"index"`
	CreatedAt time.Time      `gorm:"autoCreateTime"`
	UpdatedAt time.Time      `gorm:"autoUpdateTime"`
}

func (NoteRecord) TableName() string { return "notes" }

// NoteTaskLinkRecord — строка таблицы note_task_links (many-to-many Note↔Task).
type NoteTaskLinkRecord struct {
	ID        uint      `gorm:"primaryKey"`
	NoteID    uint      `gorm:"uniqueIndex:idx_ntl_note_task;not null;index"`
	TaskID    uint      `gorm:"uniqueIndex:idx_ntl_note_task;not null;index"`
	CreatedAt time.Time `gorm:"autoCreateTime"`
}

func (NoteTaskLinkRecord) TableName() string { return "note_task_links" }
