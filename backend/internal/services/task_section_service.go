package services

import (
	"errors"
	"strings"

	"task-manager/backend/internal/domain/user"
	"task-manager/backend/internal/models"

	"gorm.io/gorm"
)

type TaskSectionService struct {
	DB       *gorm.DB
	Projects *ProjectService
	Tasks    *TaskService
}

type TaskSectionCreate struct {
	Name string
}

type TaskSectionUpdate struct {
	Name string
}

func (s *TaskSectionService) ensureProjectAccess(projectID, userID uint, role user.Role) error {
	if s.Projects == nil {
		return ErrForbidden
	}
	_, err := s.Projects.Get(projectID, userID, role)
	return err
}

func (s *TaskSectionService) ensureManage(projectID, userID uint, role user.Role) error {
	if s.Tasks == nil {
		return ErrForbidden
	}
	ok, err := s.Tasks.CanManageProjectTasks(projectID, userID, role)
	if err != nil {
		return err
	}
	if !ok {
		return ErrForbidden
	}
	return nil
}

func (s *TaskSectionService) List(projectID, userID uint, role user.Role) ([]models.TaskSection, error) {
	if err := s.ensureProjectAccess(projectID, userID, role); err != nil {
		return nil, err
	}
	var sections []models.TaskSection
	if err := s.DB.Where("project_id = ?", projectID).
		Order("position ASC, id ASC").
		Find(&sections).Error; err != nil {
		return nil, err
	}
	return sections, nil
}

func (s *TaskSectionService) Create(projectID, userID uint, role user.Role, in TaskSectionCreate) (*models.TaskSection, error) {
	if err := s.ensureManage(projectID, userID, role); err != nil {
		return nil, err
	}
	name := strings.TrimSpace(in.Name)
	if name == "" {
		return nil, ErrInvalidInput
	}
	var maxPos int
	if err := s.DB.Model(&models.TaskSection{}).
		Where("project_id = ?", projectID).
		Select("COALESCE(MAX(position), 0)").
		Scan(&maxPos).Error; err != nil {
		return nil, err
	}
	sec := models.TaskSection{
		ProjectID: projectID,
		Name:      name,
		Position:  maxPos + 1,
	}
	if err := s.DB.Create(&sec).Error; err != nil {
		return nil, err
	}
	return &sec, nil
}

func (s *TaskSectionService) Update(projectID, sectionID, userID uint, role user.Role, in TaskSectionUpdate) (*models.TaskSection, error) {
	if err := s.ensureManage(projectID, userID, role); err != nil {
		return nil, err
	}
	name := strings.TrimSpace(in.Name)
	if name == "" {
		return nil, ErrInvalidInput
	}
	var sec models.TaskSection
	if err := s.DB.Where("id = ? AND project_id = ?", sectionID, projectID).First(&sec).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrTaskSectionNotFound
		}
		return nil, err
	}
	sec.Name = name
	if err := s.DB.Save(&sec).Error; err != nil {
		return nil, err
	}
	return &sec, nil
}

func (s *TaskSectionService) Delete(projectID, sectionID, userID uint, role user.Role) error {
	if err := s.ensureManage(projectID, userID, role); err != nil {
		return err
	}
	return s.DB.Transaction(func(tx *gorm.DB) error {
		var sec models.TaskSection
		if err := tx.Where("id = ? AND project_id = ?", sectionID, projectID).First(&sec).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrTaskSectionNotFound
			}
			return err
		}
		if err := tx.Model(&models.Task{}).
			Where("project_id = ? AND section_id = ?", projectID, sectionID).
			Update("section_id", nil).Error; err != nil {
			return err
		}
		if err := tx.Delete(&sec).Error; err != nil {
			return err
		}
		var sections []models.TaskSection
		if err := tx.Where("project_id = ?", projectID).
			Order("position ASC, id ASC").
			Find(&sections).Error; err != nil {
			return err
		}
		for i := range sections {
			if err := tx.Model(&models.TaskSection{}).
				Where("id = ?", sections[i].ID).
				Update("position", i+1).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

func (s *TaskSectionService) Reorder(projectID, userID uint, role user.Role, sectionIDs []uint) error {
	if err := s.ensureManage(projectID, userID, role); err != nil {
		return err
	}
	if len(sectionIDs) == 0 {
		return ErrInvalidInput
	}
	var sections []models.TaskSection
	if err := s.DB.Where("project_id = ?", projectID).Find(&sections).Error; err != nil {
		return err
	}
	if len(sections) != len(sectionIDs) {
		return ErrInvalidInput
	}
	existing := make(map[uint]struct{}, len(sections))
	for _, sec := range sections {
		existing[sec.ID] = struct{}{}
	}
	seen := make(map[uint]struct{}, len(sectionIDs))
	for _, id := range sectionIDs {
		if _, ok := existing[id]; !ok {
			return ErrInvalidInput
		}
		if _, dup := seen[id]; dup {
			return ErrInvalidInput
		}
		seen[id] = struct{}{}
	}
	return s.DB.Transaction(func(tx *gorm.DB) error {
		for idx, id := range sectionIDs {
			if err := tx.Model(&models.TaskSection{}).
				Where("id = ? AND project_id = ?", id, projectID).
				Update("position", idx+1).Error; err != nil {
				return err
			}
		}
		return nil
	})
}
