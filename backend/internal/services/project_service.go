package services

import (
	"errors"
	"strings"

	"task-manager/backend/internal/models"

	"gorm.io/gorm"
)

var ErrProjectNotFound = errors.New("project not found")
var ErrForbidden = errors.New("forbidden")

// ErrTeamProjectNotAllowed is returned when a global user tries to create a team project.
var ErrTeamProjectNotAllowed = errors.New("team projects require creator role or above")

type ProjectService struct {
	DB      *gorm.DB
	Members *ProjectMemberService
}

func (s *ProjectService) ListByOwner(ownerID uint) ([]models.Project, error) {
	var list []models.Project
	err := s.DB.Preload("Owner").Where("owner_id = ?", ownerID).Order("updated_at desc").Find(&list).Error
	return list, err
}

// ListForCaller returns all projects for admin/staff; for creator: owned ∪ member; for user: owned ∪ member.
func (s *ProjectService) ListForCaller(userID uint, role models.Role) ([]models.Project, error) {
	if models.IsSystemRole(role) {
		var list []models.Project
		err := s.DB.Preload("Owner").Order("updated_at desc").Find(&list).Error
		return list, err
	}
	if s.Members == nil {
		return s.ListByOwner(userID)
	}
	memberIDs, err := s.Members.MemberProjectIDs(userID)
	if err != nil {
		return nil, err
	}
	var q *gorm.DB
	if role == models.RoleUser {
		if len(memberIDs) == 0 {
			q = s.DB.Preload("Owner").Where("owner_id = ?", userID).Order("updated_at desc")
		} else {
			q = s.DB.Preload("Owner").Where("owner_id = ? OR id IN ?", userID, memberIDs).Order("updated_at desc")
		}
	} else {
		// creator and any other non-system non-user role: owned OR member
		if len(memberIDs) == 0 {
			return s.ListByOwner(userID)
		}
		q = s.DB.Preload("Owner").Where("owner_id = ? OR id IN ?", userID, memberIDs).Order("updated_at desc")
	}
	var list []models.Project
	err = q.Find(&list).Error
	return list, err
}

func (s *ProjectService) Create(ownerID uint, role models.Role, name, description string, kind models.ProjectKind) (*models.Project, error) {
	name = strings.TrimSpace(name)
	if name == "" {
		return nil, ErrInvalidInput
	}
	if kind == "" {
		if role == models.RoleUser {
			kind = models.ProjectKindPersonal
		} else {
			kind = models.ProjectKindTeam
		}
	}
	if !models.IsValidProjectKind(kind) {
		return nil, ErrInvalidInput
	}
	if kind == models.ProjectKindTeam && role == models.RoleUser {
		return nil, ErrTeamProjectNotAllowed
	}
	p := models.Project{
		Name:        name,
		Description: description,
		OwnerID:     ownerID,
		Kind:        kind,
	}
	if err := s.DB.Create(&p).Error; err != nil {
		return nil, err
	}
	if err := s.DB.Preload("Owner").First(&p, p.ID).Error; err != nil {
		return nil, err
	}
	return &p, nil
}

// Get returns the project if caller is admin/staff, owner, or any member (viewer included).
func (s *ProjectService) Get(id, callerID uint, role models.Role) (*models.Project, error) {
	var p models.Project
	if err := s.DB.Preload("Owner").First(&p, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrProjectNotFound
		}
		return nil, err
	}
	if models.IsSystemRole(role) {
		return &p, nil
	}
	if p.OwnerID == callerID {
		return &p, nil
	}
	if s.Members != nil && s.Members.IsMember(id, callerID) {
		return &p, nil
	}
	return nil, ErrForbidden
}

// canModifyProjectMetadata is true for admin/staff or project owner only.
func (s *ProjectService) canModifyProjectMetadata(p *models.Project, callerID uint, role models.Role) bool {
	if models.IsSystemRole(role) {
		return true
	}
	return p.OwnerID == callerID
}

func (s *ProjectService) Update(id, callerID uint, role models.Role, name, description string) (*models.Project, error) {
	var p models.Project
	if err := s.DB.Preload("Owner").First(&p, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrProjectNotFound
		}
		return nil, err
	}
	if !s.canModifyProjectMetadata(&p, callerID, role) {
		return nil, ErrForbidden
	}
	name = strings.TrimSpace(name)
	if name == "" {
		return nil, ErrInvalidInput
	}
	p.Name = name
	p.Description = description
	if err := s.DB.Save(&p).Error; err != nil {
		return nil, err
	}
	if err := s.DB.Preload("Owner").First(&p, p.ID).Error; err != nil {
		return nil, err
	}
	return &p, nil
}

func (s *ProjectService) Delete(id, callerID uint, role models.Role) error {
	var p models.Project
	if err := s.DB.First(&p, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrProjectNotFound
		}
		return err
	}
	if !s.canModifyProjectMetadata(&p, callerID, role) {
		return ErrForbidden
	}
	return s.DB.Delete(&p).Error
}

func (s *ProjectService) TasksForProject(projectID, callerID uint, role models.Role) ([]models.Task, error) {
	p, err := s.Get(projectID, callerID, role)
	if err != nil {
		return nil, err
	}
	var tasks []models.Task
	err = s.DB.Where("project_id = ?", p.ID).
		Preload("Section").
		Preload("Assignee").
		Preload("Subtasks", subtasksOrdered).
		Order("COALESCE(section_id, 0) ASC").
		Order("position ASC").
		Order("updated_at DESC").
		Order("id ASC").
		Find(&tasks).Error
	return tasks, err
}
