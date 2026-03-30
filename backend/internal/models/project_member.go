package models

import "time"

// ProjectRole is a per-project permission level (not the global User.Role).
type ProjectRole string

const (
	ProjectRoleManager  ProjectRole = "manager"
	ProjectRoleExecutor ProjectRole = "executor"
	ProjectRoleViewer   ProjectRole = "viewer"
)

// ProjectMember links a user to a project with a project-level role.
// The project owner is not stored here; owner has implicit full control.
type ProjectMember struct {
	ID        uint        `gorm:"primaryKey" json:"id"`
	ProjectID uint        `gorm:"uniqueIndex:idx_pm_proj_user;not null" json:"project_id"`
	UserID    uint        `gorm:"uniqueIndex:idx_pm_proj_user;not null" json:"user_id"`
	Role      ProjectRole `gorm:"type:text;not null;default:'viewer'" json:"role"`
	User      User        `gorm:"foreignKey:UserID" json:"user,omitempty"`
	CreatedAt time.Time   `json:"created_at"`
	UpdatedAt time.Time   `json:"updated_at"`
}

// IsValidProjectRole reports whether r is a known project role constant.
func IsValidProjectRole(r ProjectRole) bool {
	switch r {
	case ProjectRoleManager, ProjectRoleExecutor, ProjectRoleViewer:
		return true
	default:
		return false
	}
}
