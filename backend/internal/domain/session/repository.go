package session

import (
	"context"

	"task-manager/backend/internal/domain/user"
)

// Repository — хранилище refresh-сессий.
type Repository interface {
	Save(ctx context.Context, s *Session) error
	FindByTokenHash(ctx context.Context, hash [32]byte) (*Session, error)
	RevokeAllByUser(ctx context.Context, uid user.ID) error
}
