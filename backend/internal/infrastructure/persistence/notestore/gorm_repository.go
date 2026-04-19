package notestore

import (
	"context"
	"errors"
	"strings"

	"task-manager/backend/internal/domain/note"
	"task-manager/backend/internal/domain/project"
	"task-manager/backend/internal/domain/task"

	"gorm.io/gorm"
)

// GormRepository — реализация note.Repository на GORM.
type GormRepository struct {
	db *gorm.DB
}

// NewGormRepository создаёт репозиторий. Для вызовов внутри tx передайте tx вместо корневого db.
func NewGormRepository(db *gorm.DB) *GormRepository {
	return &GormRepository{db: db}
}

func (r *GormRepository) FindByID(ctx context.Context, id note.ID) (*note.Note, error) {
	var rec NoteRecord
	if err := r.db.WithContext(ctx).First(&rec, id.Uint()).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, note.ErrNoteNotFound
		}
		return nil, err
	}
	return toDomain(&rec), nil
}

func (r *GormRepository) FindByIDUnscoped(ctx context.Context, id note.ID) (*note.Note, error) {
	var rec NoteRecord
	if err := r.db.WithContext(ctx).Unscoped().First(&rec, id.Uint()).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, note.ErrNoteNotFound
		}
		return nil, err
	}
	return toDomain(&rec), nil
}

func (r *GormRepository) Save(ctx context.Context, n *note.Note) error {
	rec := fromDomain(n)
	if rec.ID == 0 {
		if err := r.db.WithContext(ctx).Create(&rec).Error; err != nil {
			return err
		}
		n.AssignID(note.ID(rec.ID))
		return nil
	}
	return r.db.WithContext(ctx).Save(&rec).Error
}

func (r *GormRepository) SoftDelete(ctx context.Context, id note.ID) error {
	return r.db.WithContext(ctx).Delete(&NoteRecord{}, id.Uint()).Error
}

func (r *GormRepository) Restore(ctx context.Context, id note.ID) error {
	return r.db.WithContext(ctx).Unscoped().
		Model(&NoteRecord{}).
		Where("id = ?", id.Uint()).
		Update("deleted_at", nil).Error
}

func (r *GormRepository) HardDelete(ctx context.Context, id note.ID) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Unscoped().Where("note_id = ?", id.Uint()).Delete(&NoteTaskLinkRecord{}).Error; err != nil {
			return err
		}
		return tx.Unscoped().Delete(&NoteRecord{}, id.Uint()).Error
	})
}

func (r *GormRepository) DeleteByProject(ctx context.Context, projectID project.ID) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		subQ := tx.Unscoped().Model(&NoteRecord{}).Select("id").Where("project_id = ?", projectID.Uint())
		if err := tx.Unscoped().Where("note_id IN (?)", subQ).Delete(&NoteTaskLinkRecord{}).Error; err != nil {
			return err
		}
		return tx.Unscoped().Where("project_id = ?", projectID.Uint()).Delete(&NoteRecord{}).Error
	})
}

func (r *GormRepository) ListByProject(ctx context.Context, projectID project.ID) ([]*note.Note, error) {
	var rows []NoteRecord
	if err := r.db.WithContext(ctx).
		Where("project_id = ?", projectID.Uint()).
		Order("COALESCE(section_id, 0) ASC, position ASC, updated_at DESC, id ASC").
		Find(&rows).Error; err != nil {
		return nil, err
	}
	return rowsToDomain(rows), nil
}

func (r *GormRepository) ListDeletedByProject(ctx context.Context, projectID project.ID) ([]*note.Note, error) {
	var rows []NoteRecord
	if err := r.db.WithContext(ctx).Unscoped().
		Where("project_id = ? AND deleted_at IS NOT NULL", projectID.Uint()).
		Order("deleted_at DESC").
		Find(&rows).Error; err != nil {
		return nil, err
	}
	return rowsToDomain(rows), nil
}

func (r *GormRepository) NextPosition(ctx context.Context, projectID project.ID, sectionID *project.NoteSectionID) (int, error) {
	q := r.db.WithContext(ctx).Model(&NoteRecord{}).Where("project_id = ?", projectID.Uint())
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

func (r *GormRepository) ListLinkedTasks(ctx context.Context, id note.ID) ([]task.ID, error) {
	var links []NoteTaskLinkRecord
	if err := r.db.WithContext(ctx).Where("note_id = ?", id.Uint()).Find(&links).Error; err != nil {
		return nil, err
	}
	out := make([]task.ID, len(links))
	for i := range links {
		out[i] = task.ID(links[i].TaskID)
	}
	return out, nil
}

func (r *GormRepository) ListLinkedNotes(ctx context.Context, taskID task.ID) ([]*note.Note, error) {
	var links []NoteTaskLinkRecord
	if err := r.db.WithContext(ctx).Where("task_id = ?", taskID.Uint()).Find(&links).Error; err != nil {
		return nil, err
	}
	if len(links) == 0 {
		return nil, nil
	}
	noteIDs := make([]uint, len(links))
	for i := range links {
		noteIDs[i] = links[i].NoteID
	}
	var rows []NoteRecord
	if err := r.db.WithContext(ctx).Where("id IN ?", noteIDs).Find(&rows).Error; err != nil {
		return nil, err
	}
	return rowsToDomain(rows), nil
}

func (r *GormRepository) LinkTask(ctx context.Context, noteID note.ID, taskID task.ID) error {
	link := NoteTaskLinkRecord{NoteID: noteID.Uint(), TaskID: taskID.Uint()}
	if err := r.db.WithContext(ctx).Create(&link).Error; err != nil {
		if isNoteTaskUniqueViolation(err) {
			return note.ErrLinkAlreadyExists
		}
		return err
	}
	return nil
}

func isNoteTaskUniqueViolation(err error) bool {
	if err == nil {
		return false
	}
	if errors.Is(err, gorm.ErrDuplicatedKey) {
		return true
	}
	msg := strings.ToLower(err.Error())
	return strings.Contains(msg, "unique") || strings.Contains(msg, "idx_ntl_note_task")
}

func (r *GormRepository) UnlinkTask(ctx context.Context, noteID note.ID, taskID task.ID) error {
	return r.db.WithContext(ctx).
		Where("note_id = ? AND task_id = ?", noteID.Uint(), taskID.Uint()).
		Delete(&NoteTaskLinkRecord{}).Error
}

func (r *GormRepository) HasLink(ctx context.Context, noteID note.ID, taskID task.ID) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&NoteTaskLinkRecord{}).
		Where("note_id = ? AND task_id = ?", noteID.Uint(), taskID.Uint()).
		Count(&count).Error
	return count > 0, err
}

func rowsToDomain(rows []NoteRecord) []*note.Note {
	out := make([]*note.Note, 0, len(rows))
	for i := range rows {
		out = append(out, toDomain(&rows[i]))
	}
	return out
}
