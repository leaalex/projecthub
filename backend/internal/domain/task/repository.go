package task

import (
	"context"

	"task-manager/backend/internal/domain/project"
	"task-manager/backend/internal/domain/user"
)

// ListFilter — параметры выборки задач для списков/отчётов.
type ListFilter struct {
	CallerID          user.ID
	CallerIsSystem    bool
	VisibleProjectIDs []uint // nil для system → все проекты
	ProjectID         *project.ID
	Status            *Status
}

// Repository — персистентность агрегата Task.
type Repository interface {
	FindByID(ctx context.Context, id ID) (*Task, error)
	// FindByIDUnscoped находит задачу, включая мягко удалённые.
	FindByIDUnscoped(ctx context.Context, id ID) (*Task, error)
	Save(ctx context.Context, t *Task) error
	// Delete — мягкое удаление (корзина).
	Delete(ctx context.Context, id ID) error
	// Restore снимает мягкое удаление.
	Restore(ctx context.Context, id ID) error
	// HardDelete физически удаляет задачу и подзадачи.
	HardDelete(ctx context.Context, id ID) error
	// ListDeletedByProject — мягко удалённые задачи проекта.
	ListDeletedByProject(ctx context.Context, projectID project.ID) ([]*Task, error)
	// FindDeletedByIDInProject — мягко удалённая задача в проекте (для корзины).
	FindDeletedByIDInProject(ctx context.Context, projectID project.ID, id ID) (*Task, error)
	DeleteByProject(ctx context.Context, projectID project.ID) error
	ListVisible(ctx context.Context, filter ListFilter) ([]*Task, error)
	NextPosition(ctx context.Context, projectID project.ID, sectionID *project.SectionID) (int, error)

	// ListByAssignee — задачи проекта, назначенные на assigneeID.
	ListByAssignee(ctx context.Context, projectID project.ID, assigneeID user.ID) ([]*Task, error)
	// ReassignByAssignee — массово меняет assignee_id у всех задач oldAssignee в проекте; newAssignee == nil → снять назначение.
	ReassignByAssignee(ctx context.Context, projectID project.ID, oldAssignee user.ID, newAssignee *user.ID) error
	// ReassignOne — одна задача в рамках проекта (для ручного переноса в транзакции).
	ReassignOne(ctx context.Context, id ID, projectID project.ID, newAssignee *user.ID) error
}
