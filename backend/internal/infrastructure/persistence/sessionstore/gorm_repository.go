package sessionstore

import (
	"context"
	"errors"
	"time"

	"task-manager/backend/internal/domain/session"
	"task-manager/backend/internal/domain/user"

	"gorm.io/gorm"
)

type GormRepository struct {
	db *gorm.DB
}

func NewGormRepository(db *gorm.DB) *GormRepository {
	return &GormRepository{db: db}
}

func (r *GormRepository) Save(ctx context.Context, s *session.Session) error {
	rec := domainToRecord(s)
	if s.ID().Uint() == 0 {
		rec.ID = 0
		if err := r.db.WithContext(ctx).Create(&rec).Error; err != nil {
			return err
		}
		s.AssignID(session.ID(rec.ID))
		return nil
	}
	return r.db.WithContext(ctx).Save(&rec).Error
}

func (r *GormRepository) FindByTokenHash(ctx context.Context, hash [32]byte) (*session.Session, error) {
	var rec Record
	if err := r.db.WithContext(ctx).Where("token_hash = ?", hash[:]).First(&rec).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, session.ErrSessionNotFound
		}
		return nil, err
	}
	return recordToDomain(&rec), nil
}

func (r *GormRepository) RevokeAllByUser(ctx context.Context, uid user.ID) error {
	now := time.Now()
	return r.db.WithContext(ctx).Model(&Record{}).
		Where("user_id = ? AND revoked_at IS NULL", uid.Uint()).
		Update("revoked_at", now).Error
}
