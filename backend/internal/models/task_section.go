package models

import "time"

// TaskSection groups tasks within a project.
type TaskSection struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	ProjectID uint      `gorm:"not null;index" json:"project_id"`
	Project   Project   `gorm:"foreignKey:ProjectID" json:"-"`
	Name      string    `gorm:"not null" json:"name"`
	Position  int       `gorm:"not null;default:0;index" json:"position"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
