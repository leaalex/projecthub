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
