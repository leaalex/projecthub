package note

import "task-manager/backend/internal/domain/project"

// ListFilter — параметры выборки заметок для глобального списка (GET /notes).
type ListFilter struct {
	CallerIsSystem    bool
	VisibleProjectIDs []uint // для не-системной роли: проекты участия; пустой → пустой результат
	ProjectID         *project.ID
}
