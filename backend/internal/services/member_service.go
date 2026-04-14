package services

import (
	"errors"
	"strings"

	"task-manager/backend/internal/models"

	"gorm.io/gorm"
)

var (
	ErrAlreadyProjectMember              = errors.New("user is already a project member")
	ErrTargetUserNotFound              = errors.New("user not found")
	ErrNotProjectMember                = errors.New("user is not a member of this project")
	ErrCannotRemoveOwner               = errors.New("cannot remove project owner")
	ErrPersonalProjectMembersNotAllowed = errors.New("personal projects do not support members")
)

// ProjectMemberService manages project_members rows and membership checks.
type ProjectMemberService struct {
	DB *gorm.DB
}

// ProjectKind returns the project's kind.
func (m *ProjectMemberService) ProjectKind(projectID uint) (models.ProjectKind, error) {
	var p models.Project
	if err := m.DB.Select("kind").First(&p, projectID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return "", ErrProjectNotFound
		}
		return "", err
	}
	return p.Kind, nil
}

// List returns all members for a project with User preloaded.
func (m *ProjectMemberService) List(projectID uint) ([]models.ProjectMember, error) {
	var list []models.ProjectMember
	err := m.DB.Where("project_id = ?", projectID).Preload("User").Order("project_members.id ASC").Find(&list).Error
	return list, err
}

// Add inserts a membership row; fails if user is already a member.
func (m *ProjectMemberService) Add(projectID, userID uint, role models.ProjectRole) (*models.ProjectMember, error) {
	if !models.IsValidProjectRole(role) {
		return nil, ErrInvalidInput
	}
	var p models.Project
	if err := m.DB.First(&p, projectID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrProjectNotFound
		}
		return nil, err
	}
	if p.Kind == models.ProjectKindPersonal {
		return nil, ErrPersonalProjectMembersNotAllowed
	}
	if p.OwnerID == userID {
		return nil, ErrForbidden
	}
	var existing int64
	if err := m.DB.Model(&models.ProjectMember{}).Where("project_id = ? AND user_id = ?", projectID, userID).Count(&existing).Error; err != nil {
		return nil, err
	}
	if existing > 0 {
		return nil, ErrAlreadyProjectMember
	}
	pm := models.ProjectMember{
		ProjectID: projectID,
		UserID:    userID,
		Role:      role,
	}
	if err := m.DB.Create(&pm).Error; err != nil {
		return nil, err
	}
	if err := m.DB.Preload("User").First(&pm, pm.ID).Error; err != nil {
		return nil, err
	}
	return &pm, nil
}

// UpdateRole changes a member's role; owner is not in this table.
func (m *ProjectMemberService) UpdateRole(projectID, userID uint, newRole models.ProjectRole) (*models.ProjectMember, error) {
	if !models.IsValidProjectRole(newRole) {
		return nil, ErrInvalidInput
	}
	var p models.Project
	if err := m.DB.First(&p, projectID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrProjectNotFound
		}
		return nil, err
	}
	if p.Kind == models.ProjectKindPersonal {
		return nil, ErrPersonalProjectMembersNotAllowed
	}
	if p.OwnerID == userID {
		return nil, ErrForbidden
	}
	var pm models.ProjectMember
	if err := m.DB.Where("project_id = ? AND user_id = ?", projectID, userID).First(&pm).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrNotProjectMember
		}
		return nil, err
	}
	pm.Role = newRole
	if err := m.DB.Save(&pm).Error; err != nil {
		return nil, err
	}
	if err := m.DB.Preload("User").First(&pm, pm.ID).Error; err != nil {
		return nil, err
	}
	return &pm, nil
}

// Remove deletes a membership; cannot remove the project owner.
func (m *ProjectMemberService) Remove(projectID, userID uint) error {
	var p models.Project
	if err := m.DB.First(&p, projectID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrProjectNotFound
		}
		return err
	}
	if p.Kind == models.ProjectKindPersonal {
		return ErrPersonalProjectMembersNotAllowed
	}
	if p.OwnerID == userID {
		return ErrCannotRemoveOwner
	}
	res := m.DB.Where("project_id = ? AND user_id = ?", projectID, userID).Delete(&models.ProjectMember{})
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return ErrNotProjectMember
	}
	return nil
}

// GetMemberRole returns the member's role and true if they have a row in project_members.
func (m *ProjectMemberService) GetMemberRole(projectID, userID uint) (models.ProjectRole, bool) {
	var pm models.ProjectMember
	if err := m.DB.Select("role").Where("project_id = ? AND user_id = ?", projectID, userID).First(&pm).Error; err != nil {
		return "", false
	}
	return pm.Role, true
}

// IsMember is true if user has a project_members row (not including owner).
func (m *ProjectMemberService) IsMember(projectID, userID uint) bool {
	_, ok := m.GetMemberRole(projectID, userID)
	return ok
}

// IsOwnerOrMember is true if user owns the project or has a membership row.
func (m *ProjectMemberService) IsOwnerOrMember(projectID, userID uint) bool {
	var p models.Project
	if err := m.DB.First(&p, projectID).Error; err != nil {
		return false
	}
	if p.OwnerID == userID {
		return true
	}
	return m.IsMember(projectID, userID)
}

// CanAccessProject is true for admin/staff, owner, or any member (including viewer).
func (m *ProjectMemberService) CanAccessProject(projectID, userID uint, globalRole models.Role) bool {
	if models.IsSystemRole(globalRole) {
		return true
	}
	return m.IsOwnerOrMember(projectID, userID)
}

// CanManageMembers is true for admin/staff, project owner, or manager member.
func (m *ProjectMemberService) CanManageMembers(projectID, userID uint, globalRole models.Role) bool {
	if models.IsSystemRole(globalRole) {
		return true
	}
	var p models.Project
	if err := m.DB.First(&p, projectID).Error; err != nil {
		return false
	}
	if p.OwnerID == userID {
		return true
	}
	r, ok := m.GetMemberRole(projectID, userID)
	return ok && r == models.ProjectRoleManager
}

// CallerProjectRoleString is a stable label for API responses (owner / manager / executor / viewer / admin / staff).
func (m *ProjectMemberService) CallerProjectRoleString(projectID, callerID uint, globalRole models.Role) string {
	switch globalRole {
	case models.RoleAdmin:
		return "admin"
	case models.RoleStaff:
		return "staff"
	}
	var p models.Project
	if err := m.DB.First(&p, projectID).Error; err != nil {
		return ""
	}
	if p.OwnerID == callerID {
		return "owner"
	}
	if r, ok := m.GetMemberRole(projectID, callerID); ok {
		return string(r)
	}
	return ""
}

// MemberProjectIDs returns project IDs where the user has a membership row.
func (m *ProjectMemberService) MemberProjectIDs(userID uint) ([]uint, error) {
	var ids []uint
	err := m.DB.Model(&models.ProjectMember{}).Where("user_id = ?", userID).Pluck("project_id", &ids).Error
	return ids, err
}

// TransferOwnership sets a new owner (admin/staff only at handler level).
// The previous owner is ensured a manager membership so they retain access.
func (m *ProjectMemberService) TransferOwnership(projectID, newOwnerID, callerID uint, globalRole models.Role) error {
	if !models.IsSystemRole(globalRole) {
		return ErrForbidden
	}
	var p models.Project
	if err := m.DB.First(&p, projectID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrProjectNotFound
		}
		return err
	}
	if err := m.DB.First(&models.User{}, newOwnerID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrTargetUserNotFound
		}
		return err
	}
	oldOwnerID := p.OwnerID
	if oldOwnerID == newOwnerID {
		return ErrInvalidInput
	}
	return m.DB.Transaction(func(tx *gorm.DB) error {
		if oldOwnerID != newOwnerID {
			var n int64
			if err := tx.Model(&models.ProjectMember{}).Where("project_id = ? AND user_id = ?", projectID, oldOwnerID).Count(&n).Error; err != nil {
				return err
			}
			if n == 0 {
				pm := models.ProjectMember{
					ProjectID: projectID,
					UserID:    oldOwnerID,
					Role:      models.ProjectRoleManager,
				}
				if err := tx.Create(&pm).Error; err != nil {
					return err
				}
			} else {
				if err := tx.Model(&models.ProjectMember{}).Where("project_id = ? AND user_id = ?", projectID, oldOwnerID).Update("role", models.ProjectRoleManager).Error; err != nil {
					return err
				}
			}
		}
		if err := tx.Model(&models.Project{}).Where("id = ?", projectID).Update("owner_id", newOwnerID).Error; err != nil {
			return err
		}
		// New owner should not remain only as viewer/executor row without being owner — remove duplicate member row if any.
		if err := tx.Where("project_id = ? AND user_id = ?", projectID, newOwnerID).Delete(&models.ProjectMember{}).Error; err != nil {
			return err
		}
		return nil
	})
}

// ResolveUserIDByEmail finds a user by email (case-insensitive trim).
func (m *ProjectMemberService) ResolveUserIDByEmail(email string) (uint, error) {
	email = strings.TrimSpace(strings.ToLower(email))
	if email == "" {
		return 0, ErrInvalidInput
	}
	var u models.User
	if err := m.DB.Where("LOWER(email) = ?", email).First(&u).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return 0, ErrTargetUserNotFound
		}
		return 0, err
	}
	return u.ID, nil
}

// AssigneeAllowedOnProject is true if assignee is the owner or a project member.
func (m *ProjectMemberService) AssigneeAllowedOnProject(projectID, assigneeID uint) (bool, error) {
	var p models.Project
	if err := m.DB.First(&p, projectID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return false, ErrProjectNotFound
		}
		return false, err
	}
	if p.OwnerID == assigneeID {
		return true, nil
	}
	return m.IsMember(projectID, assigneeID), nil
}
