package services

import (
	"errors"
	"strings"

	"task-manager/backend/internal/domain/user"
	"task-manager/backend/internal/models"

	"gorm.io/gorm"
)

var ErrSubtaskNotFound = errors.New("subtask not found")

type SubtaskService struct {
	DB    *gorm.DB
	Tasks *TaskService
}

// List возвращает подзадачи задачи, если пользователь имеет к ней доступ.
func (s *SubtaskService) List(taskID, userID uint, role user.Role) ([]models.Subtask, error) {
	_, err := s.Tasks.Get(taskID, userID, role)
	if err != nil {
		return nil, err
	}
	var list []models.Subtask
	err = s.DB.Where("task_id = ?", taskID).Order("position ASC, id ASC").Find(&list).Error
	return list, err
}

// Create добавляет подзадачу в конец; только владелец проекта.
func (s *SubtaskService) Create(taskID, userID uint, role user.Role, title string) (*models.Subtask, error) {
	t, err := s.Tasks.Get(taskID, userID, role)
	if err != nil {
		return nil, err
	}
	ok, err := s.Tasks.CanManageProjectTasks(t.ProjectID, userID, role)
	if err != nil {
		return nil, err
	}
	if !ok {
		return nil, ErrForbidden
	}
	title = strings.TrimSpace(title)
	if title == "" {
		return nil, ErrInvalidInput
	}
	var last models.Subtask
	nextPos := 0
	q := s.DB.Where("task_id = ?", taskID).Order("position DESC, id DESC").First(&last)
	if q.Error == nil {
		nextPos = last.Position + 1
	} else if !errors.Is(q.Error, gorm.ErrRecordNotFound) {
		return nil, q.Error
	}
	st := models.Subtask{
		TaskID:   taskID,
		Title:    title,
		Done:     false,
		Position: nextPos,
	}
	if err := s.DB.Create(&st).Error; err != nil {
		return nil, err
	}
	return &st, nil
}

func (s *SubtaskService) getSubtaskForTask(subtaskID, taskID uint) (*models.Subtask, error) {
	var st models.Subtask
	if err := s.DB.First(&st, subtaskID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrSubtaskNotFound
		}
		return nil, err
	}
	if st.TaskID != taskID {
		return nil, ErrSubtaskNotFound
	}
	return &st, nil
}

type SubtaskUpdate struct {
	Title    *string
	Done     *bool
	Position *int
}

// Update редактирует подзадачу; только владелец проекта.
func (s *SubtaskService) Update(taskID, subtaskID, userID uint, role user.Role, in SubtaskUpdate) (*models.Subtask, error) {
	t, err := s.Tasks.Get(taskID, userID, role)
	if err != nil {
		return nil, err
	}
	ok, err := s.Tasks.CanManageProjectTasks(t.ProjectID, userID, role)
	if err != nil {
		return nil, err
	}
	if !ok {
		return nil, ErrForbidden
	}
	st, err := s.getSubtaskForTask(subtaskID, taskID)
	if err != nil {
		return nil, err
	}
	if in.Title != nil {
		v := strings.TrimSpace(*in.Title)
		if v == "" {
			return nil, ErrInvalidInput
		}
		st.Title = v
	}
	if in.Done != nil {
		st.Done = *in.Done
	}
	if in.Position != nil {
		st.Position = *in.Position
	}
	if err := s.DB.Save(st).Error; err != nil {
		return nil, err
	}
	return st, nil
}

// Delete удаляет подзадачу; только владелец проекта.
func (s *SubtaskService) Delete(taskID, subtaskID, userID uint, role user.Role) error {
	t, err := s.Tasks.Get(taskID, userID, role)
	if err != nil {
		return err
	}
	ok, err := s.Tasks.CanManageProjectTasks(t.ProjectID, userID, role)
	if err != nil {
		return err
	}
	if !ok {
		return ErrForbidden
	}
	st, err := s.getSubtaskForTask(subtaskID, taskID)
	if err != nil {
		return err
	}
	return s.DB.Delete(st).Error
}

// Toggle инвертирует флаг done; только владелец проекта или назначенный на задачу.
func (s *SubtaskService) Toggle(taskID, subtaskID, userID uint, role user.Role) (*models.Subtask, error) {
	t, err := s.Tasks.Get(taskID, userID, role)
	if err != nil {
		return nil, err
	}
	isManager, err := s.Tasks.CanManageProjectTasks(t.ProjectID, userID, role)
	if err != nil {
		return nil, err
	}
	isAssignee := t.AssigneeID != nil && *t.AssigneeID == userID
	if !isManager && !isAssignee {
		return nil, ErrForbidden
	}
	st, err := s.getSubtaskForTask(subtaskID, taskID)
	if err != nil {
		return nil, err
	}
	st.Done = !st.Done
	if err := s.DB.Save(st).Error; err != nil {
		return nil, err
	}
	return st, nil
}
