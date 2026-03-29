package services

import (
	"errors"
	"strings"
	"time"

	"task-manager/backend/internal/models"

	"gorm.io/gorm"
)

var ErrTaskNotFound = errors.New("task not found")

// subtasksOrdered is a GORM scope for consistent subtask ordering in Preload.
func subtasksOrdered(db *gorm.DB) *gorm.DB {
	return db.Order("subtasks.position ASC, subtasks.id ASC")
}

// preloadTaskAll loads Project, Assignee, and ordered Subtasks for a task query.
func preloadTaskAll(db *gorm.DB) *gorm.DB {
	return db.Preload("Project").Preload("Assignee").Preload("Subtasks", subtasksOrdered)
}

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

	q := preloadTaskAll(s.DB.Model(&models.Task{}))
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

// IsProjectOwner reports whether userID owns the project.
func (s *TaskService) IsProjectOwner(projectID, userID uint) (bool, error) {
	return s.isProjectOwner(projectID, userID)
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
	if err := preloadTaskAll(s.DB).First(&t, id).Error; err != nil {
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
	preloadTaskAll(s.DB).First(&t, t.ID)
	return &t, nil
}

type TaskUpdate struct {
	Title       *string
	Description *string
	Status      *models.TaskStatus
	Priority    *models.TaskPriority
	ProjectID   *uint
	DueDate     *string
}

func assigneeMayReopenDone(t *models.Task, userID uint, in TaskUpdate) bool {
	if in.Status == nil {
		return false
	}
	if t.Status != models.StatusDone || *in.Status == models.StatusDone {
		return false
	}
	if in.Title != nil || in.Description != nil || in.Priority != nil || in.DueDate != nil || in.ProjectID != nil {
		return false
	}
	if t.AssigneeID == nil || *t.AssigneeID != userID {
		return false
	}
	return true
}

func (s *TaskService) Update(id, userID uint, in TaskUpdate) (*models.Task, error) {
	t, err := s.Get(id, userID)
	if err != nil {
		return nil, err
	}
	owner, err := s.isProjectOwner(t.ProjectID, userID)
	if err != nil {
		return nil, err
	}
	if owner {
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
		if in.ProjectID != nil {
			newPID := *in.ProjectID
			if newPID == 0 {
				return nil, ErrInvalidInput
			}
			if newPID != t.ProjectID {
				ok, err := s.isProjectOwner(newPID, userID)
				if err != nil {
					return nil, err
				}
				if !ok {
					return nil, ErrForbidden
				}
				t.ProjectID = newPID
			}
		}
		if in.DueDate != nil {
			raw := strings.TrimSpace(*in.DueDate)
			if raw == "" {
				t.DueDate = nil
			} else {
				d, err := time.Parse("2006-01-02", raw)
				if err != nil {
					return nil, ErrInvalidInput
				}
				t.DueDate = &d
			}
		}
		if err := s.DB.Save(t).Error; err != nil {
			return nil, err
		}
		preloadTaskAll(s.DB).First(t, t.ID)
		return t, nil
	}

	if assigneeMayReopenDone(t, userID, in) {
		t.Status = *in.Status
		if err := s.DB.Save(t).Error; err != nil {
			return nil, err
		}
		preloadTaskAll(s.DB).First(t, t.ID)
		return t, nil
	}

	return nil, ErrForbidden
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
	if assigneeID == 0 {
		t.AssigneeID = nil
		if err := s.DB.Save(t).Error; err != nil {
			return nil, err
		}
		preloadTaskAll(s.DB).First(t, t.ID)
		return t, nil
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
	preloadTaskAll(s.DB).First(t, t.ID)
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
	preloadTaskAll(s.DB).First(t, t.ID)
	return t, nil
}
