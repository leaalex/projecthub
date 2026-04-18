package models

import "time"

// ProjectRole — уровень прав доступа внутри проекта (не глобальная User.Role).
type ProjectRole string

const (
	ProjectRoleManager  ProjectRole = "manager"
	ProjectRoleExecutor ProjectRole = "executor"
	ProjectRoleViewer   ProjectRole = "viewer"
)

// ProjectMember связывает пользователя с проектом и задаёт его роль внутри проекта.
// Владелец проекта здесь не хранится; у него неявный полный контроль.
type ProjectMember struct {
	ID        uint        `gorm:"primaryKey" json:"id"`
	ProjectID uint        `gorm:"uniqueIndex:idx_pm_proj_user;not null" json:"project_id"`
	UserID    uint        `gorm:"uniqueIndex:idx_pm_proj_user;not null" json:"user_id"`
	Role      ProjectRole `gorm:"type:text;not null;default:'viewer'" json:"role"`
	User      User        `gorm:"foreignKey:UserID" json:"user,omitempty"`
	CreatedAt time.Time   `json:"created_at"`
	UpdatedAt time.Time   `json:"updated_at"`
}

// IsValidProjectRole сообщает, является ли r известной константой роли проекта.
func IsValidProjectRole(r ProjectRole) bool {
	switch r {
	case ProjectRoleManager, ProjectRoleExecutor, ProjectRoleViewer:
		return true
	default:
		return false
	}
}
