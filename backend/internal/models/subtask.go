package models

import "time"

type Subtask struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	TaskID    uint      `gorm:"not null;index;constraint:OnDelete:CASCADE,OnUpdate:CASCADE" json:"task_id"`
	Title     string    `gorm:"not null" json:"title"`
	Done      bool      `gorm:"default:false" json:"done"`
	Position  int       `gorm:"default:0" json:"position"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
