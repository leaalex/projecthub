package project

import (
	"context"

	"task-manager/backend/internal/domain/user"
)

// Repository — персистентность агрегата Project (корень + members + sections).
type Repository interface {
	FindByID(ctx context.Context, id ID) (*Project, error)
	ListAll(ctx context.Context) ([]*Project, error)
	ListByOwner(ctx context.Context, owner user.ID) ([]*Project, error)
	ListMemberships(ctx context.Context, uid user.ID) ([]ID, error)
	ListOwnedProjectIDs(ctx context.Context, uid user.ID) ([]uint, error)
	Save(ctx context.Context, p *Project) error
	SoftDelete(ctx context.Context, id ID) error
	Restore(ctx context.Context, id ID) error
	// HardDelete физически удаляет проект, участников и секции (задачи — через task.Repository).
	HardDelete(ctx context.Context, id ID) error

	IsOwner(ctx context.Context, id ID, uid user.ID) (bool, error)
	// IsOwnerIncludingDeleted — проверка владельца по строке проекта без фильтра soft-delete (для Restore).
	IsOwnerIncludingDeleted(ctx context.Context, id ID, uid user.ID) (bool, error)
	GetMemberRole(ctx context.Context, id ID, uid user.ID) (Role, bool, error)
	AssigneeAllowed(ctx context.Context, id ID, uid user.ID) (bool, error)
}
