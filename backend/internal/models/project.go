package models

import "time"

// ProjectKind distinguishes personal (solo) vs team (collaboration) projects.
type ProjectKind string

const (
	ProjectKindPersonal ProjectKind = "personal"
	ProjectKindTeam     ProjectKind = "team"
)

// IsValidProjectKind reports whether k is a known project kind.
func IsValidProjectKind(k ProjectKind) bool {
	switch k {
	case ProjectKindPersonal, ProjectKindTeam:
		return true
	default:
		return false
	}
}

type Project struct {
	ID          uint        `gorm:"primaryKey" json:"id"`
	Name        string      `gorm:"not null" json:"name"`
	Description string      `json:"description"`
	Kind        ProjectKind `gorm:"type:text;not null;default:'team'" json:"kind"`
	OwnerID     uint        `gorm:"not null;index" json:"owner_id"`
	Owner       User        `gorm:"foreignKey:OwnerID" json:"owner,omitempty"`
	CreatedAt   time.Time   `json:"created_at"`
	UpdatedAt   time.Time   `json:"updated_at"`
}

// TaskTransferMode defines how to handle tasks when removing a project member
type TaskTransferMode string

const (
	TransferUnassigned TaskTransferMode = "unassigned" // Set all tasks to NULL
	TransferSingleUser TaskTransferMode = "single_user" // Assign all to one user
	TransferManual     TaskTransferMode = "manual"     // Manual per-task assignment
)

// TaskTransferRequest represents the removal request with transfer options
type TaskTransferRequest struct {
	TransferMode     TaskTransferMode `json:"transfer_mode" binding:"required,oneof=unassigned single_user manual"`
	TransferToUserID *uint            `json:"transfer_to_user_id,omitempty"` // Required for single_user mode
}

// TaskTransfer represents a single task reassignment in manual mode
type TaskTransfer struct {
	TaskID     uint `json:"task_id" binding:"required"`
	AssigneeID uint `json:"assignee_id" binding:"required,min=1"` // Must be valid member, 0 not allowed
}

// TaskTransferBatch represents manual transfer request
type TaskTransferBatch struct {
	Transfers []TaskTransfer `json:"transfers" binding:"required,min=1"`
}
