package services

import (
	"errors"
	"strings"

	"task-manager/backend/internal/models"

	"gorm.io/gorm"
)

var ErrTaskNotFound = errors.New("task not found")

type TaskService struct {
	DB *gorm.DB
}

func (s *TaskService) ownedProjectIDs(userID uint) ([]uint, error) {
	var ids []uint
	err := s.DB.Model(&models.Project{}).Where("owner_id = ?", userID).Pluck("id", &ids).Error
	return ids, err
}

func (s *TaskService) List(userID uint, projectID *uint, status *models.TaskStatus) ([]models.Task, error) {
	owned, err := s.ownedProjectIDs(userID)
	if err != nil {
		return nil, err
	}

	q := s.DB.Model(&models.Task{}).Preload("Project").Preload("Assignee")
	switch {
	case len(owned) > 0:
		q = q.Where("project_id IN ? OR assignee_id = ?", owned, userID)
	default:
		q = q.Where("assignee_id = ?", userID)
	}

	if projectID != nil {
		q = q.Where("project_id = ?", *projectID)
	}
	if status != nil {
		q = q.Where("status = ?", *status)
	}

	var tasks []models.Task
	err = q.Order("updated_at desc").Find(&tasks).Error
	return tasks, err
}

func (s *TaskService) canAccessTask(task *models.Task, userID uint) bool {
	if task.AssigneeID != nil && *task.AssigneeID == userID {
		return true
	}
	var p models.Project
	if err := s.DB.First(&p, task.ProjectID).Error; err != nil {
		return false
	}
	return p.OwnerID == userID
}

func (s *TaskService) isProjectOwner(projectID, userID uint) (bool, error) {
	var p models.Project
	if err := s.DB.First(&p, projectID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return false, nil
		}
		return false, err
	}
	return p.OwnerID == userID, nil
}

func (s *TaskService) Get(id, userID uint) (*models.Task, error) {
	var t models.Task
	if err := s.DB.Preload("Project").Preload("Assignee").First(&t, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrTaskNotFound
		}
		return nil, err
	}
	if !s.canAccessTask(&t, userID) {
		return nil, ErrForbidden
	}
	return &t, nil
}

type TaskCreate struct {
	Title       string
	Description string
	ProjectID   uint
	Status      models.TaskStatus
	Priority    models.TaskPriority
	DueDate     *string // ISO date optional
}

func (s *TaskService) Create(userID uint, in TaskCreate) (*models.Task, error) {
	if in.ProjectID == 0 {
		return nil, ErrInvalidInput
	}
	ok, err := s.isProjectOwner(in.ProjectID, userID)
	if err != nil {
		return nil, err
	}
	if !ok {
		return nil, ErrForbidden
	}
	title := strings.TrimSpace(in.Title)
	if title == "" {
		return nil, ErrInvalidInput
	}
	st := in.Status
	if st == "" {
		st = models.StatusTodo
	}
	pr := in.Priority
	if pr == "" {
		pr = models.PriorityMedium
	}
	t := models.Task{
		Title:       title,
		Description: in.Description,
		ProjectID:   in.ProjectID,
		Status:      st,
		Priority:    pr,
	}
	if err := s.DB.Create(&t).Error; err != nil {
		return nil, err
	}
	s.DB.Preload("Project").Preload("Assignee").First(&t, t.ID)
	return &t, nil
}

type TaskUpdate struct {
	Title       *string
	Description *string
	Status      *models.TaskStatus
	Priority    *models.TaskPriority
	DueDate     *string
}

func (s *TaskService) Update(id, userID uint, in TaskUpdate) (*models.Task, error) {
	t, err := s.Get(id, userID)
	if err != nil {
		return nil, err
	}
	ok, err := s.isProjectOwner(t.ProjectID, userID)
	if err != nil || !ok {
		if err == nil {
			err = ErrForbidden
		}
		return nil, err
	}
	if in.Title != nil {
		v := strings.TrimSpace(*in.Title)
		if v == "" {
			return nil, ErrInvalidInput
		}
		t.Title = v
	}
	if in.Description != nil {
		t.Description = *in.Description
	}
	if in.Status != nil {
		t.Status = *in.Status
	}
	if in.Priority != nil {
		t.Priority = *in.Priority
	}
	if err := s.DB.Save(t).Error; err != nil {
		return nil, err
	}
	s.DB.Preload("Project").Preload("Assignee").First(t, t.ID)
	return t, nil
}

func (s *TaskService) Delete(id, userID uint) error {
	t, err := s.Get(id, userID)
	if err != nil {
		return err
	}
	ok, err := s.isProjectOwner(t.ProjectID, userID)
	if err != nil || !ok {
		if err == nil {
			err = ErrForbidden
		}
		return err
	}
	return s.DB.Delete(t).Error
}

func (s *TaskService) Assign(taskID, ownerUserID, assigneeID uint) (*models.Task, error) {
	t, err := s.Get(taskID, ownerUserID)
	if err != nil {
		return nil, err
	}
	ok, err := s.isProjectOwner(t.ProjectID, ownerUserID)
	if err != nil || !ok {
		if err == nil {
			err = ErrForbidden
		}
		return nil, err
	}
	var u models.User
	if err := s.DB.First(&u, assigneeID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrInvalidInput
		}
		return nil, err
	}
	t.AssigneeID = &assigneeID
	if err := s.DB.Save(t).Error; err != nil {
		return nil, err
	}
	s.DB.Preload("Project").Preload("Assignee").First(t, t.ID)
	return t, nil
}

func (s *TaskService) Complete(taskID, userID uint) (*models.Task, error) {
	t, err := s.Get(taskID, userID)
	if err != nil {
		return nil, err
	}
	owner, err := s.isProjectOwner(t.ProjectID, userID)
	if err != nil {
		return nil, err
	}
	assignee := t.AssigneeID != nil && *t.AssigneeID == userID
	if !owner && !assignee {
		return nil, ErrForbidden
	}
	done := models.StatusDone
	t.Status = done
	if err := s.DB.Save(t).Error; err != nil {
		return nil, err
	}
	s.DB.Preload("Project").Preload("Assignee").First(t, t.ID)
	return t, nil
}
