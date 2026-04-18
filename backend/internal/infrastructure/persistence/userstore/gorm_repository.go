package userstore

import (
	"context"
	"errors"

	"task-manager/backend/internal/domain/user"

	"gorm.io/gorm"
)

// GormRepository реализует user.Repository поверх GORM.
type GormRepository struct {
	db *gorm.DB
}

func NewGormRepository(db *gorm.DB) *GormRepository {
	return &GormRepository{db: db}
}

func (r *GormRepository) FindByID(ctx context.Context, id user.ID) (*user.User, error) {
	var rec Record
	if err := r.db.WithContext(ctx).First(&rec, id.Uint()).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, user.ErrUserNotFound
		}
		return nil, err
	}
	return recordToDomain(&rec)
}

func (r *GormRepository) FindByEmail(ctx context.Context, e user.Email) (*user.User, error) {
	var rec Record
	if err := r.db.WithContext(ctx).Where("email = ?", e.String()).First(&rec).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, user.ErrUserNotFound
		}
		return nil, err
	}
	return recordToDomain(&rec)
}

func (r *GormRepository) List(ctx context.Context) ([]*user.User, error) {
	var rows []Record
	if err := r.db.WithContext(ctx).Order("id asc").Find(&rows).Error; err != nil {
		return nil, err
	}
	out := make([]*user.User, 0, len(rows))
	for i := range rows {
		u, err := recordToDomain(&rows[i])
		if err != nil {
			return nil, err
		}
		out = append(out, u)
	}
	return out, nil
}

func (r *GormRepository) Save(ctx context.Context, u *user.User) error {
	rec := domainToRecord(u)
	if u.ID().Uint() == 0 {
		rec.ID = 0
		if err := r.db.WithContext(ctx).Create(&rec).Error; err != nil {
			if isUniqueViolation(err) {
				return user.ErrEmailTaken
			}
			return err
		}
		u.AssignID(user.ID(rec.ID))
		return nil
	}
	if err := r.db.WithContext(ctx).Save(&rec).Error; err != nil {
		if isUniqueViolation(err) {
			return user.ErrEmailTaken
		}
		return err
	}
	return nil
}

func (r *GormRepository) Delete(ctx context.Context, id user.ID) error {
	res := r.db.WithContext(ctx).Delete(&Record{}, id.Uint())
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return user.ErrUserNotFound
	}
	return nil
}

func isUniqueViolation(err error) bool {
	if err == nil {
		return false
	}
	return errors.Is(err, gorm.ErrDuplicatedKey)
}
