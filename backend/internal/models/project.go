package models

import "time"

// ProjectKind разграничивает личные (solo) и командные (collaboration) проекты.
type ProjectKind string

const (
	ProjectKindPersonal ProjectKind = "personal"
	ProjectKindTeam     ProjectKind = "team"
)

// IsValidProjectKind сообщает, является ли k известным типом проекта.
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

// TaskTransferMode определяет, как обрабатывать задачи при удалении участника проекта
type TaskTransferMode string

const (
	TransferUnassigned TaskTransferMode = "unassigned" // Установить все задачи в NULL
	TransferSingleUser TaskTransferMode = "single_user" // Назначить все одному пользователю
	TransferManual     TaskTransferMode = "manual"     // Ручное назначение по каждой задаче
)

// TaskTransferRequest представляет запрос на удаление с параметрами переноса задач
type TaskTransferRequest struct {
	TransferMode     TaskTransferMode `json:"transfer_mode" binding:"required,oneof=unassigned single_user manual"`
	TransferToUserID *uint            `json:"transfer_to_user_id,omitempty"` // Обязательно для режима single_user
}

// TaskTransfer представляет одно переназначение задачи в ручном режиме
type TaskTransfer struct {
	TaskID     uint `json:"task_id" binding:"required"`
	AssigneeID uint `json:"assignee_id" binding:"required,min=1"` // Должен быть действительным участником, 0 не допускается
}

// TaskTransferBatch представляет запрос ручного переноса задач
type TaskTransferBatch struct {
	Transfers []TaskTransfer `json:"transfers" binding:"required,min=1"`
}
