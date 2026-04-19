package taskstore

import (
	"context"
	"errors"

	"task-manager/backend/internal/domain/project"
	"task-manager/backend/internal/domain/task"
	"task-manager/backend/internal/domain/user"

	"gorm.io/gorm"
)

// GormRepository — реализация task.Repository на GORM.
type GormRepository struct {
	db *gorm.DB
}

// NewGormRepository создаёт репозиторий. Для вызовов внутри tx передайте tx вместо корневого db.
func NewGormRepository(db *gorm.DB) *GormRepository {
	return &GormRepository{db: db}
}

func (r *GormRepository) FindByID(ctx context.Context, id task.ID) (*task.Task, error) {
	var tr TaskRecord
	if err := r.db.WithContext(ctx).First(&tr, id.Uint()).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, task.ErrTaskNotFound
		}
		return nil, err
	}
	var subRows []SubtaskRecord
	if err := r.db.WithContext(ctx).Where("task_id = ?", tr.ID).Order("position ASC, id ASC").Find(&subRows).Error; err != nil {
		return nil, err
	}
	return recordToDomain(&tr, subRows)
}

func (r *GormRepository) FindByIDUnscoped(ctx context.Context, id task.ID) (*task.Task, error) {
	var tr TaskRecord
	if err := r.db.WithContext(ctx).Unscoped().First(&tr, id.Uint()).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, task.ErrTaskNotFound
		}
		return nil, err
	}
	var subRows []SubtaskRecord
	if err := r.db.WithContext(ctx).Where("task_id = ?", tr.ID).Order("position ASC, id ASC").Find(&subRows).Error; err != nil {
		return nil, err
	}
	return recordToDomain(&tr, subRows)
}

func (r *GormRepository) NextPosition(ctx context.Context, projectID project.ID, sectionID *project.SectionID) (int, error) {
	q := r.db.WithContext(ctx).Model(&TaskRecord{}).Where("project_id = ?", projectID.Uint())
	if sectionID == nil {
		q = q.Where("section_id IS NULL")
	} else {
		q = q.Where("section_id = ?", sectionID.Uint())
	}
	var maxPos int
	if err := q.Select("COALESCE(MAX(position), 0)").Scan(&maxPos).Error; err != nil {
		return 0, err
	}
	return maxPos + 1, nil
}

func (r *GormRepository) Save(ctx context.Context, t *task.Task) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		rec := taskToRecord(t)
		if rec.ID == 0 {
			if err := tx.Create(&rec).Error; err != nil {
				return err
			}
			t.AssignID(task.ID(rec.ID))
		} else {
			if err := tx.Save(&rec).Error; err != nil {
				return err
			}
		}
		tid := t.ID().Uint()

		var idsInAgg []uint
		for _, s := range t.Subtasks() {
			if s != nil && s.ID() != 0 {
				idsInAgg = append(idsInAgg, s.ID().Uint())
			}
		}
		q := tx.Where("task_id = ?", tid)
		if len(idsInAgg) == 0 {
			if err := q.Delete(&SubtaskRecord{}).Error; err != nil {
				return err
			}
		} else {
			if err := q.Where("id NOT IN ?", idsInAgg).Delete(&SubtaskRecord{}).Error; err != nil {
				return err
			}
		}

		for _, s := range t.Subtasks() {
			if s == nil {
				continue
			}
			sr := subtaskToRecord(tid, s)
			if sr.ID == 0 {
				if err := tx.Create(&sr).Error; err != nil {
					return err
				}
				s.AssignID(task.SubtaskID(sr.ID))
			} else {
				if err := tx.Model(&SubtaskRecord{}).Where("id = ?", sr.ID).Updates(map[string]any{
					"title":      sr.Title,
					"done":       sr.Done,
					"position":   sr.Position,
					"updated_at": sr.UpdatedAt,
				}).Error; err != nil {
					return err
				}
			}
		}
		return nil
	})
}

func (r *GormRepository) Delete(ctx context.Context, id task.ID) error {
	return r.db.WithContext(ctx).Delete(&TaskRecord{}, id.Uint()).Error
}

func (r *GormRepository) Restore(ctx context.Context, id task.ID) error {
	return r.db.WithContext(ctx).Unscoped().
		Model(&TaskRecord{}).
		Where("id = ?", id.Uint()).
		Update("deleted_at", nil).Error
}

func (r *GormRepository) HardDelete(ctx context.Context, id task.ID) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Unscoped().Where("task_id = ?", id.Uint()).Delete(&SubtaskRecord{}).Error; err != nil {
			return err
		}
		return tx.Unscoped().Delete(&TaskRecord{}, id.Uint()).Error
	})
}

func (r *GormRepository) ListDeletedByProject(ctx context.Context, projectID project.ID) ([]*task.Task, error) {
	var rows []TaskRecord
	if err := r.db.WithContext(ctx).Unscoped().
		Where("project_id = ? AND deleted_at IS NOT NULL", projectID.Uint()).
		Order("deleted_at DESC").
		Find(&rows).Error; err != nil {
		return nil, err
	}
	if len(rows) == 0 {
		return nil, nil
	}
	ids := make([]uint, len(rows))
	for i := range rows {
		ids[i] = rows[i].ID
	}
	var allSubs []SubtaskRecord
	if err := r.db.WithContext(ctx).Where("task_id IN ?", ids).Order("position ASC, id ASC").Find(&allSubs).Error; err != nil {
		return nil, err
	}
	byTask := make(map[uint][]SubtaskRecord)
	for i := range allSubs {
		tid := allSubs[i].TaskID
		byTask[tid] = append(byTask[tid], allSubs[i])
	}
	out := make([]*task.Task, 0, len(rows))
	for i := range rows {
		subs := byTask[rows[i].ID]
		tr, err := recordToDomain(&rows[i], subs)
		if err != nil {
			return nil, err
		}
		out = append(out, tr)
	}
	return out, nil
}

func (r *GormRepository) DeleteByProject(ctx context.Context, projectID project.ID) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		subQ := tx.Unscoped().Model(&TaskRecord{}).Select("id").Where("project_id = ?", projectID.Uint())
		if err := tx.Unscoped().Where("task_id IN (?)", subQ).Delete(&SubtaskRecord{}).Error; err != nil {
			return err
		}
		return tx.Unscoped().Where("project_id = ?", projectID.Uint()).Delete(&TaskRecord{}).Error
	})
}

func (r *GormRepository) ListByAssignee(ctx context.Context, projectID project.ID, assigneeID user.ID) ([]*task.Task, error) {
	var rows []TaskRecord
	if err := r.db.WithContext(ctx).
		Where("project_id = ? AND assignee_id = ?", projectID.Uint(), assigneeID.Uint()).
		Order("id ASC").
		Find(&rows).Error; err != nil {
		return nil, err
	}
	if len(rows) == 0 {
		return nil, nil
	}
	ids := make([]uint, len(rows))
	for i := range rows {
		ids[i] = rows[i].ID
	}
	var allSubs []SubtaskRecord
	if err := r.db.WithContext(ctx).Where("task_id IN ?", ids).Order("position ASC, id ASC").Find(&allSubs).Error; err != nil {
		return nil, err
	}
	byTask := make(map[uint][]SubtaskRecord)
	for i := range allSubs {
		tid := allSubs[i].TaskID
		byTask[tid] = append(byTask[tid], allSubs[i])
	}
	out := make([]*task.Task, 0, len(rows))
	for i := range rows {
		subs := byTask[rows[i].ID]
		if subs == nil {
			subs = nil
		}
		tr, err := recordToDomain(&rows[i], subs)
		if err != nil {
			return nil, err
		}
		out = append(out, tr)
	}
	return out, nil
}

func (r *GormRepository) ReassignByAssignee(ctx context.Context, projectID project.ID, oldAssignee user.ID, newAssignee *user.ID) error {
	q := r.db.WithContext(ctx).Model(&TaskRecord{}).
		Where("project_id = ? AND assignee_id = ?", projectID.Uint(), oldAssignee.Uint())
	if newAssignee == nil {
		return q.Updates(map[string]any{"assignee_id": nil}).Error
	}
	return q.Update("assignee_id", newAssignee.Uint()).Error
}

func (r *GormRepository) ReassignOne(ctx context.Context, id task.ID, projectID project.ID, newAssignee *user.ID) error {
	q := r.db.WithContext(ctx).Model(&TaskRecord{}).
		Where("id = ? AND project_id = ?", id.Uint(), projectID.Uint())
	if newAssignee == nil {
		return q.Updates(map[string]any{"assignee_id": nil}).Error
	}
	return q.Update("assignee_id", newAssignee.Uint()).Error
}

func (r *GormRepository) ListVisible(ctx context.Context, filter task.ListFilter) ([]*task.Task, error) {
	q := r.db.WithContext(ctx).Model(&TaskRecord{})
	if !filter.CallerIsSystem {
		if len(filter.VisibleProjectIDs) > 0 {
			q = q.Where("project_id IN ? OR assignee_id = ?", filter.VisibleProjectIDs, filter.CallerID.Uint())
		} else {
			q = q.Where("assignee_id = ?", filter.CallerID.Uint())
		}
	}
	if filter.ProjectID != nil {
		q = q.Where("project_id = ?", filter.ProjectID.Uint())
	}
	if filter.Status != nil {
		q = q.Where("status = ?", filter.Status.String())
	}

	var rows []TaskRecord
	if err := q.Order("COALESCE(section_id, 0) ASC").Order("position ASC").Order("updated_at DESC").Order("id ASC").Find(&rows).Error; err != nil {
		return nil, err
	}
	if len(rows) == 0 {
		return nil, nil
	}
	ids := make([]uint, len(rows))
	for i := range rows {
		ids[i] = rows[i].ID
	}
	var allSubs []SubtaskRecord
	if err := r.db.WithContext(ctx).Where("task_id IN ?", ids).Order("position ASC, id ASC").Find(&allSubs).Error; err != nil {
		return nil, err
	}
	byTask := make(map[uint][]SubtaskRecord)
	for i := range allSubs {
		tid := allSubs[i].TaskID
		byTask[tid] = append(byTask[tid], allSubs[i])
	}
	out := make([]*task.Task, 0, len(rows))
	for i := range rows {
		subs := byTask[rows[i].ID]
		if subs == nil {
			subs = nil
		}
		tr, err := recordToDomain(&rows[i], subs)
		if err != nil {
			return nil, err
		}
		out = append(out, tr)
	}
	return out, nil
}
