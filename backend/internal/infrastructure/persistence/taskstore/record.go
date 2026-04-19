package taskstore

import "time"

// TaskRecord — строка таблицы tasks (без GORM-ассоциаций).
type TaskRecord struct {
	ID          uint       `gorm:"primaryKey"`
	Title       string     `gorm:"not null"`
	Description string     `gorm:"type:text"`
	Status      string     `gorm:"type:text;not null;default:'todo'"`
	Priority    string     `gorm:"type:text;not null;default:'medium'"`
	ProjectID   uint       `gorm:"not null;index"`
	SectionID   *uint      `gorm:"index"`
	Position    int        `gorm:"not null;default:0;index"`
	AssigneeID  *uint      `gorm:"index"`
	DueDate     *time.Time `json:"due_date"`
	CreatedAt   time.Time  `gorm:"autoCreateTime"`
	UpdatedAt   time.Time  `gorm:"autoUpdateTime"`
}

func (TaskRecord) TableName() string { return "tasks" }

// SubtaskRecord — строка таблицы subtasks.
type SubtaskRecord struct {
	ID        uint      `gorm:"primaryKey"`
	TaskID    uint      `gorm:"not null;index"`
	Title     string    `gorm:"not null"`
	Done      bool      `gorm:"default:false"`
	Position  int       `gorm:"default:0"`
	CreatedAt time.Time `gorm:"autoCreateTime"`
	UpdatedAt time.Time `gorm:"autoUpdateTime"`
}

func (SubtaskRecord) TableName() string { return "subtasks" }
