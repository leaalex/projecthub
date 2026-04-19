package reportstore

import (
	"context"
	"errors"

	"task-manager/backend/internal/domain/report"

	"gorm.io/gorm"
)

// GormRepository реализует report.Repository.
type GormRepository struct {
	db *gorm.DB
}

// NewGormRepository создаёт репозиторий saved_reports.
func NewGormRepository(db *gorm.DB) *GormRepository {
	return &GormRepository{db: db}
}

func (r *GormRepository) FindByID(ctx context.Context, id report.ID) (*report.SavedReport, error) {
	var rec SavedReportRecord
	if err := r.db.WithContext(ctx).First(&rec, id.Uint()).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, report.ErrNotFound
		}
		return nil, err
	}
	return toDomain(&rec), nil
}

func (r *GormRepository) Save(ctx context.Context, rep *report.SavedReport) error {
	rec := fromDomain(rep)
	if err := r.db.WithContext(ctx).Create(&rec).Error; err != nil {
		return err
	}
	rep.ID = rec.ID
	rep.CreatedAt = rec.CreatedAt
	return nil
}

func (r *GormRepository) Delete(ctx context.Context, id report.ID) error {
	return r.db.WithContext(ctx).Delete(&SavedReportRecord{}, id.Uint()).Error
}

func (r *GormRepository) ListForCaller(ctx context.Context, callerID uint, callerIsSystem bool) ([]*report.SavedReport, error) {
	q := r.db.WithContext(ctx).Model(&SavedReportRecord{}).Order("created_at desc")
	if !callerIsSystem {
		q = q.Where("user_id = ?", callerID)
	}
	var rows []SavedReportRecord
	if err := q.Find(&rows).Error; err != nil {
		return nil, err
	}
	out := make([]*report.SavedReport, 0, len(rows))
	for i := range rows {
		out = append(out, toDomain(&rows[i]))
	}
	return out, nil
}
