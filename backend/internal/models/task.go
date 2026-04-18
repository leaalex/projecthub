package models

import "time"

type TaskStatus string

const (
	StatusTodo       TaskStatus = "todo"
	StatusInProgress TaskStatus = "in_progress"
	StatusReview     TaskStatus = "review"
	StatusDone       TaskStatus = "done"
)

type TaskPriority string

const (
	PriorityLow      TaskPriority = "low"
	PriorityMedium   TaskPriority = "medium"
	PriorityHigh     TaskPriority = "high"
	PriorityCritical TaskPriority = "critical"
)

type Task struct {
	ID          uint         `gorm:"primaryKey" json:"id"`
	Title       string       `gorm:"not null" json:"title"`
	Description string       `json:"description"`
	Status      TaskStatus   `gorm:"default:'todo'" json:"status"`
	Priority    TaskPriority `gorm:"default:'medium'" json:"priority"`
	ProjectID   uint         `gorm:"not null;index" json:"project_id"`
	Project     Project      `gorm:"foreignKey:ProjectID" json:"-"`
	SectionID   *uint        `gorm:"index" json:"section_id"`
	Section     *TaskSection `gorm:"foreignKey:SectionID" json:"section,omitempty"`
	Position    int          `gorm:"not null;default:0;index" json:"position"`
	AssigneeID  *uint        `gorm:"index" json:"assignee_id"`
	Assignee    *User        `gorm:"foreignKey:AssigneeID" json:"assignee,omitempty"`
	DueDate     *time.Time   `json:"due_date"`
	Subtasks    []Subtask    `gorm:"foreignKey:TaskID" json:"subtasks"`
	CreatedAt   time.Time    `json:"created_at"`
	UpdatedAt   time.Time    `json:"updated_at"`

	// Caller ACL (не хранится в БД; устанавливается в API-ответах для текущего пользователя).
	CallerCanManage       bool `json:"caller_can_manage" gorm:"-"`
	CallerCanChangeStatus bool `json:"caller_can_change_status" gorm:"-"`
}
