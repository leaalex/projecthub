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
	ErrCannotTransferToSelf            = errors.New("cannot transfer tasks to the member being removed")
	ErrTargetNotProjectMember          = errors.New("transfer target must be a project member or owner")
	ErrInvalidTaskTransfer             = errors.New("task does not belong to the member being removed")
	ErrDuplicateTaskTransfer           = errors.New("duplicate task in transfer list")
	ErrCannotTransferToSameMember      = errors.New("cannot assign task to the member being removed")
	ErrInvalidAssignee                 = errors.New("assignee must be a project member or owner")
	ErrIncompleteTaskTransfer          = errors.New("all tasks must be reassigned before removing member")
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

// RemoveResult contains the outcome of member removal attempt
type RemoveResult struct {
	Success     bool           `json:"success"`
	MemberID    uint           `json:"member_id,omitempty"`
	TaskCount   int            `json:"task_count,omitempty"`
	Tasks       []models.Task  `json:"tasks,omitempty"`       // Populated for manual mode
	Transferred int            `json:"transferred,omitempty"`   // Count of reassigned tasks
}

// Remove removes a project member with optional task transfer
// For manual mode, returns tasks list without removing member (two-step process)
func (m *ProjectMemberService) Remove(projectID, userID uint, mode models.TaskTransferMode, transferToUserID *uint) (*RemoveResult, error) {
	// 1. Check project and member exist
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
		return nil, ErrCannotRemoveOwner
	}

	// 2. Verify member exists
	var pm models.ProjectMember
	if err := m.DB.Where("project_id = ? AND user_id = ?", projectID, userID).First(&pm).Error; err != nil {
		return nil, ErrNotProjectMember
	}

	// 3. Get member's tasks
	var tasks []models.Task
	if err := m.DB.Where("project_id = ? AND assignee_id = ?", projectID, userID).Find(&tasks).Error; err != nil {
		return nil, err
	}

	// 4. No tasks - simple removal
	if len(tasks) == 0 {
		res := m.DB.Where("project_id = ? AND user_id = ?", projectID, userID).Delete(&models.ProjectMember{})
		if res.Error != nil {
			return nil, res.Error
		}
		if res.RowsAffected == 0 {
			return nil, ErrNotProjectMember
		}
		return &RemoveResult{Success: true, MemberID: userID}, nil
	}

	// 5. Has tasks - handle based on mode
	switch mode {
	case models.TransferManual:
		// Return tasks without removing member (client will show UI)
		return &RemoveResult{
			Success:   false, // Not fully complete yet
			MemberID:  userID,
			TaskCount: len(tasks),
			Tasks:     tasks,
		}, nil

	case models.TransferUnassigned:
		// Set all tasks to NULL
		if err := m.DB.Model(&models.Task{}).
			Where("project_id = ? AND assignee_id = ?", projectID, userID).
			Update("assignee_id", nil).Error; err != nil {
			return nil, err
		}

	case models.TransferSingleUser:
		// Validate target user
		if transferToUserID == nil || *transferToUserID == 0 {
			return nil, ErrInvalidInput
		}
		if *transferToUserID == userID {
			return nil, ErrCannotTransferToSelf
		}
		// Check target is project member or owner
		isMember := m.IsMember(projectID, *transferToUserID)
		isOwner := p.OwnerID == *transferToUserID
		if !isMember && !isOwner {
			return nil, ErrTargetNotProjectMember
		}
		// Update all tasks
		if err := m.DB.Model(&models.Task{}).
			Where("project_id = ? AND assignee_id = ?", projectID, userID).
			Update("assignee_id", *transferToUserID).Error; err != nil {
			return nil, err
		}
	}

	// 6. Remove member after successful transfer
	res := m.DB.Where("project_id = ? AND user_id = ?", projectID, userID).Delete(&models.ProjectMember{})
	if res.Error != nil {
		return nil, res.Error
	}
	if res.RowsAffected == 0 {
		return nil, ErrNotProjectMember
	}

	return &RemoveResult{
		Success:     true,
		MemberID:    userID,
		TaskCount:   len(tasks),
		Transferred: len(tasks),
	}, nil
}

// ApplyManualTaskTransfers applies task reassignments and removes member
// Validation: all tasks must be reassigned, new assignees must be valid members
func (m *ProjectMemberService) ApplyManualTaskTransfers(projectID, userID uint, transfers []models.TaskTransfer) (*RemoveResult, error) {
	// 1. Get all tasks currently assigned to this member
	var memberTasks []models.Task
	if err := m.DB.Where("project_id = ? AND assignee_id = ?", projectID, userID).Find(&memberTasks).Error; err != nil {
		return nil, err
	}
	if len(memberTasks) == 0 {
		// No tasks, just remove member
		res := m.DB.Where("project_id = ? AND user_id = ?", projectID, userID).Delete(&models.ProjectMember{})
		if res.Error != nil {
			return nil, res.Error
		}
		return &RemoveResult{Success: true}, nil
	}

	// 2. Build map of expected task IDs
	expectedTaskIDs := make(map[uint]bool)
	for _, t := range memberTasks {
		expectedTaskIDs[t.ID] = true
	}

	// 3. Validate transfers
	transferTaskIDs := make(map[uint]bool)
	for _, tr := range transfers {
		// Check task belongs to member
		if !expectedTaskIDs[tr.TaskID] {
			return nil, ErrInvalidTaskTransfer
		}
		// Check for duplicates
		if transferTaskIDs[tr.TaskID] {
			return nil, ErrDuplicateTaskTransfer
		}
		transferTaskIDs[tr.TaskID] = true

		// Validate new assignee
		if tr.AssigneeID == userID {
			return nil, ErrCannotTransferToSameMember
		}
		// Check assignee is valid project member or owner
		var p models.Project
		m.DB.First(&p, projectID)
		isMember := m.IsMember(projectID, tr.AssigneeID)
		isOwner := p.OwnerID == tr.AssigneeID
		if !isMember && !isOwner {
			return nil, ErrInvalidAssignee
		}
	}

	// 4. Check ALL tasks are covered
	if len(transfers) != len(memberTasks) {
		return nil, ErrIncompleteTaskTransfer
	}

	// 5. Apply updates in transaction
	tx := m.DB.Begin()
	for _, tr := range transfers {
		if err := tx.Model(&models.Task{}).
			Where("id = ? AND project_id = ?", tr.TaskID, projectID).
			Update("assignee_id", tr.AssigneeID).Error; err != nil {
			tx.Rollback()
			return nil, err
		}
	}

	// 6. Remove member
	res := tx.Where("project_id = ? AND user_id = ?", projectID, userID).Delete(&models.ProjectMember{})
	if res.Error != nil {
		tx.Rollback()
		return nil, res.Error
	}
	if res.RowsAffected == 0 {
		tx.Rollback()
		return nil, ErrNotProjectMember
	}

	tx.Commit()
	return &RemoveResult{
		Success:     true,
		MemberID:    userID,
		TaskCount:   len(memberTasks),
		Transferred: len(transfers),
	}, nil
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
