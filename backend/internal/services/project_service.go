package services

import (
	"errors"
	"strings"

	"task-manager/backend/internal/models"

	"gorm.io/gorm"
)

var ErrProjectNotFound = errors.New("project not found")
var ErrForbidden = errors.New("forbidden")

type ProjectService struct {
	DB *gorm.DB
}

func (s *ProjectService) ListByOwner(ownerID uint) ([]models.Project, error) {
	var list []models.Project
	err := s.DB.Preload("Owner").Where("owner_id = ?", ownerID).Order("updated_at desc").Find(&list).Error
	return list, err
}

func (s *ProjectService) Create(ownerID uint, name, description string) (*models.Project, error) {
	name = strings.TrimSpace(name)
	if name == "" {
		return nil, ErrInvalidInput
	}
	p := models.Project{
		Name:        name,
		Description: description,
		OwnerID:     ownerID,
	}
	if err := s.DB.Create(&p).Error; err != nil {
		return nil, err
	}
	if err := s.DB.Preload("Owner").First(&p, p.ID).Error; err != nil {
		return nil, err
	}
	return &p, nil
}

func (s *ProjectService) Get(id, ownerID uint) (*models.Project, error) {
	var p models.Project
	if err := s.DB.Preload("Owner").First(&p, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrProjectNotFound
		}
		return nil, err
	}
	if p.OwnerID != ownerID {
		return nil, ErrForbidden
	}
	return &p, nil
}

func (s *ProjectService) Update(id, ownerID uint, name, description string) (*models.Project, error) {
	p, err := s.Get(id, ownerID)
	if err != nil {
		return nil, err
	}
	name = strings.TrimSpace(name)
	if name == "" {
		return nil, ErrInvalidInput
	}
	p.Name = name
	p.Description = description
	if err := s.DB.Save(p).Error; err != nil {
		return nil, err
	}
	if err := s.DB.Preload("Owner").First(p, p.ID).Error; err != nil {
		return nil, err
	}
	return p, nil
}

func (s *ProjectService) Delete(id, ownerID uint) error {
	p, err := s.Get(id, ownerID)
	if err != nil {
		return err
	}
	return s.DB.Delete(p).Error
}

func (s *ProjectService) TasksForProject(projectID, ownerID uint) ([]models.Task, error) {
	p, err := s.Get(projectID, ownerID)
	if err != nil {
		return nil, err
	}
	var tasks []models.Task
	err = s.DB.Where("project_id = ?", p.ID).Preload("Assignee").Order("updated_at desc").Find(&tasks).Error
	return tasks, err
}
