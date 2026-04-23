package projectstore

import (
	"time"

	"gorm.io/gorm"
)

// ProjectRecord — строка таблицы projects.
type ProjectRecord struct {
	ID          uint           `gorm:"primaryKey"`
	Name        string         `gorm:"not null"`
	Description string         `gorm:"type:text"`
	Kind        string         `gorm:"type:text;not null;default:'team'"`
	OwnerID     uint           `gorm:"not null;index"`
	DeletedAt   gorm.DeletedAt `gorm:"index"`
	CreatedAt   time.Time      `gorm:"autoCreateTime"`
	UpdatedAt   time.Time      `gorm:"autoUpdateTime"`
}

func (ProjectRecord) TableName() string { return "projects" }

// MemberRecord — строка project_members.
type MemberRecord struct {
	ID        uint      `gorm:"primaryKey"`
	ProjectID uint      `gorm:"uniqueIndex:idx_pm_proj_user;not null"`
	UserID    uint      `gorm:"uniqueIndex:idx_pm_proj_user;not null"`
	Role      string    `gorm:"type:text;not null;default:'viewer'"`
	CreatedAt time.Time `gorm:"autoCreateTime"`
	UpdatedAt time.Time `gorm:"autoUpdateTime"`
}

func (MemberRecord) TableName() string { return "project_members" }

// SectionRecord — строка project_sections (общие секции задач и заметок).
type SectionRecord struct {
	ID          uint      `gorm:"primaryKey"`
	ProjectID   uint      `gorm:"not null;index"`
	Name        string    `gorm:"not null"`
	Position    int       `gorm:"not null;default:0;index"`
	DisplayMode string    `gorm:"type:text;not null;default:'plain'"`
	CreatedAt   time.Time `gorm:"autoCreateTime"`
	UpdatedAt   time.Time `gorm:"autoUpdateTime"`
}

func (SectionRecord) TableName() string { return "project_sections" }
