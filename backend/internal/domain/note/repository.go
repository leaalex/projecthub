package note

import (
	"context"

	"task-manager/backend/internal/domain/project"
	"task-manager/backend/internal/domain/task"
)

// Repository — персистентность агрегата Note.
type Repository interface {
	FindByID(ctx context.Context, id ID) (*Note, error)
	// FindByIDUnscoped находит заметку включая мягко удалённые (для Restore/HardDelete).
	FindByIDUnscoped(ctx context.Context, id ID) (*Note, error)
	Save(ctx context.Context, n *Note) error
	// SoftDelete устанавливает deleted_at.
	SoftDelete(ctx context.Context, id ID) error
	// Restore снимает deleted_at.
	Restore(ctx context.Context, id ID) error
	// HardDelete физически удаляет заметку и все её связи с задачами.
	HardDelete(ctx context.Context, id ID) error
	// DeleteByProject физически удаляет все заметки и связи проекта (каскадное удаление проекта).
	DeleteByProject(ctx context.Context, projectID project.ID) error

	// ListVisible возвращает живые заметки по фильтру видимости проектов (глобальный список).
	ListVisible(ctx context.Context, filter ListFilter) ([]*Note, error)

	// ListByProject возвращает живые (не удалённые) заметки проекта.
	ListByProject(ctx context.Context, projectID project.ID) ([]*Note, error)
	// ListDeletedByProject возвращает мягко удалённые заметки проекта.
	ListDeletedByProject(ctx context.Context, projectID project.ID) ([]*Note, error)
	// FindDeletedByIDInProject — мягко удалённая заметка в проекте (для корзины).
	FindDeletedByIDInProject(ctx context.Context, projectID project.ID, id ID) (*Note, error)

	// NextPosition возвращает следующую позицию в секции/проекте для новой заметки.
	NextPosition(ctx context.Context, projectID project.ID, sectionID *project.SectionID) (int, error)

	// ListLinkedTasks возвращает id задач, связанных с заметкой.
	ListLinkedTasks(ctx context.Context, noteID ID) ([]task.ID, error)
	// ListLinkedNotes возвращает заметки, связанные с задачей.
	ListLinkedNotes(ctx context.Context, taskID task.ID) ([]*Note, error)
	// LinkTask создаёт связь note↔task.
	LinkTask(ctx context.Context, noteID ID, taskID task.ID) error
	// UnlinkTask удаляет связь note↔task.
	UnlinkTask(ctx context.Context, noteID ID, taskID task.ID) error
	// HasLink проверяет существование связи.
	HasLink(ctx context.Context, noteID ID, taskID task.ID) (bool, error)
}
