package projectstore

import (
	"context"
	"errors"

	"task-manager/backend/internal/domain/project"
	"task-manager/backend/internal/domain/user"
	"task-manager/backend/internal/infrastructure/persistence/taskstore"

	"gorm.io/gorm"
)

type GormRepository struct {
	db *gorm.DB
}

func NewGormRepository(db *gorm.DB) *GormRepository {
	return &GormRepository{db: db}
}

func (r *GormRepository) FindByID(ctx context.Context, id project.ID) (*project.Project, error) {
	var pr ProjectRecord
	if err := r.db.WithContext(ctx).First(&pr, id.Uint()).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, project.ErrProjectNotFound
		}
		return nil, err
	}
	var memRows []MemberRecord
	if err := r.db.WithContext(ctx).Where("project_id = ?", id.Uint()).Order("project_members.id ASC").Find(&memRows).Error; err != nil {
		return nil, err
	}
	var secRows []SectionRecord
	if err := r.db.WithContext(ctx).Where("project_id = ?", id.Uint()).Order("position ASC, id ASC").Find(&secRows).Error; err != nil {
		return nil, err
	}
	return recordToDomain(&pr, memRows, secRows)
}

func (r *GormRepository) ListAll(ctx context.Context) ([]*project.Project, error) {
	var rows []ProjectRecord
	if err := r.db.WithContext(ctx).Order("updated_at DESC").Find(&rows).Error; err != nil {
		return nil, err
	}
	out := make([]*project.Project, 0, len(rows))
	for i := range rows {
		p, err := recordToDomain(&rows[i], nil, nil)
		if err != nil {
			return nil, err
		}
		out = append(out, p)
	}
	return out, nil
}

func (r *GormRepository) ListByOwner(ctx context.Context, owner user.ID) ([]*project.Project, error) {
	var rows []ProjectRecord
	if err := r.db.WithContext(ctx).Where("owner_id = ?", owner.Uint()).Order("updated_at DESC").Find(&rows).Error; err != nil {
		return nil, err
	}
	out := make([]*project.Project, 0, len(rows))
	for i := range rows {
		p, err := recordToDomain(&rows[i], nil, nil)
		if err != nil {
			return nil, err
		}
		out = append(out, p)
	}
	return out, nil
}

func (r *GormRepository) ListOwnedProjectIDs(ctx context.Context, uid user.ID) ([]uint, error) {
	var ids []uint
	err := r.db.WithContext(ctx).Model(&ProjectRecord{}).Where("owner_id = ?", uid.Uint()).Pluck("id", &ids).Error
	return ids, err
}

func (r *GormRepository) ListMemberships(ctx context.Context, uid user.ID) ([]project.ID, error) {
	var ids []uint
	err := r.db.WithContext(ctx).
		Table("project_members").
		Select("project_members.project_id").
		Joins("INNER JOIN projects ON projects.id = project_members.project_id").
		Where("project_members.user_id = ? AND projects.deleted_at IS NULL", uid.Uint()).
		Pluck("project_members.project_id", &ids).Error
	if err != nil {
		return nil, err
	}
	out := make([]project.ID, len(ids))
	for i, id := range ids {
		out[i] = project.ID(id)
	}
	return out, nil
}

func (r *GormRepository) SoftDelete(ctx context.Context, id project.ID) error {
	return r.db.WithContext(ctx).Delete(&ProjectRecord{}, id.Uint()).Error
}

func (r *GormRepository) Restore(ctx context.Context, id project.ID) error {
	return r.db.WithContext(ctx).Unscoped().Model(&ProjectRecord{}).Where("id = ?", id.Uint()).Update("deleted_at", gorm.Expr("NULL")).Error
}

func (r *GormRepository) HardDelete(ctx context.Context, id project.ID) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Unscoped().Where("project_id = ?", id.Uint()).Delete(&MemberRecord{}).Error; err != nil {
			return err
		}
		if err := tx.Unscoped().Where("project_id = ?", id.Uint()).Delete(&SectionRecord{}).Error; err != nil {
			return err
		}
		return tx.Unscoped().Delete(&ProjectRecord{}, id.Uint()).Error
	})
}

func (r *GormRepository) Save(ctx context.Context, p *project.Project) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		rec := projectToRecord(p)
		if p.ID().Uint() == 0 {
			if err := tx.Create(&rec).Error; err != nil {
				return err
			}
			p.AssignID(project.ID(rec.ID))
		} else {
			if err := tx.Save(&rec).Error; err != nil {
				return err
			}
		}
		pid := p.ID()

		var oldMembers []MemberRecord
		if err := tx.Where("project_id = ?", pid.Uint()).Find(&oldMembers).Error; err != nil {
			return err
		}
		wantUser := make(map[uint]struct{}, len(p.Members()))
		for _, m := range p.Members() {
			wantUser[m.UserID().Uint()] = struct{}{}
		}
		for i := range oldMembers {
			om := oldMembers[i]
			if _, ok := wantUser[om.UserID]; !ok {
				if err := tx.Delete(&MemberRecord{}, om.ID).Error; err != nil {
					return err
				}
			}
		}
		for _, m := range p.Members() {
			mr := memberToRecord(pid, m)
			if mr.ID == 0 {
				if err := tx.Create(&mr).Error; err != nil {
					return err
				}
				m.AssignID(project.MemberID(mr.ID))
			} else {
				if err := tx.Model(&MemberRecord{}).Where("id = ?", mr.ID).Updates(map[string]any{
					"user_id":    mr.UserID,
					"role":       mr.Role,
					"updated_at": mr.UpdatedAt,
				}).Error; err != nil {
					return err
				}
			}
		}

		var oldSecs []SectionRecord
		if err := tx.Where("project_id = ?", pid.Uint()).Find(&oldSecs).Error; err != nil {
			return err
		}
		wantSecID := make(map[uint]struct{})
		for _, s := range p.Sections() {
			if s.ID() != 0 {
				wantSecID[s.ID().Uint()] = struct{}{}
			}
		}
		for i := range oldSecs {
			os := oldSecs[i]
			if _, ok := wantSecID[os.ID]; !ok {
				if err := tx.Model(&taskstore.TaskRecord{}).
					Where("project_id = ? AND section_id = ?", pid.Uint(), os.ID).
					Update("section_id", nil).Error; err != nil {
					return err
				}
				if err := tx.Delete(&SectionRecord{}, os.ID).Error; err != nil {
					return err
				}
			}
		}
		for _, s := range p.Sections() {
			sr := sectionToRecord(pid, s)
			if sr.ID == 0 {
				if err := tx.Create(&sr).Error; err != nil {
					return err
				}
				s.AssignID(project.SectionID(sr.ID))
			} else {
				if err := tx.Model(&SectionRecord{}).Where("id = ?", sr.ID).Updates(map[string]any{
					"name":       sr.Name,
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

func (r *GormRepository) IsOwner(ctx context.Context, id project.ID, uid user.ID) (bool, error) {
	var n int64
	err := r.db.WithContext(ctx).Model(&ProjectRecord{}).Where("id = ? AND owner_id = ?", id.Uint(), uid.Uint()).Count(&n).Error
	return n > 0, err
}

func (r *GormRepository) IsOwnerIncludingDeleted(ctx context.Context, id project.ID, uid user.ID) (bool, error) {
	var n int64
	err := r.db.WithContext(ctx).Unscoped().Model(&ProjectRecord{}).Where("id = ? AND owner_id = ?", id.Uint(), uid.Uint()).Count(&n).Error
	return n > 0, err
}

func (r *GormRepository) GetMemberRole(ctx context.Context, id project.ID, uid user.ID) (project.Role, bool, error) {
	var mr MemberRecord
	if err := r.db.WithContext(ctx).Select("role").Where("project_id = ? AND user_id = ?", id.Uint(), uid.Uint()).First(&mr).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return "", false, nil
		}
		return "", false, err
	}
	role, err := project.ParseRole(mr.Role)
	if err != nil {
		return "", false, err
	}
	return role, true, nil
}

func (r *GormRepository) AssigneeAllowed(ctx context.Context, id project.ID, uid user.ID) (bool, error) {
	ok, err := r.IsOwner(ctx, id, uid)
	if err != nil || ok {
		return ok, err
	}
	_, ok2, err := r.GetMemberRole(ctx, id, uid)
	return ok2, err
}
