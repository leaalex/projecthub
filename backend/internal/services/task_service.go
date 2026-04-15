package services

import (
	"errors"
	"strings"
	"time"

	"task-manager/backend/internal/models"

	"gorm.io/gorm"
)

var ErrTaskNotFound = errors.New("task not found")

// ErrAssigneeNotProjectMember is returned when assigning a user who is not owner or member.
var ErrAssigneeNotProjectMember = errors.New("assignee must be project owner or member")

// subtasksOrdered is a GORM scope for consistent subtask ordering in Preload.
func subtasksOrdered(db *gorm.DB) *gorm.DB {
	return db.Order("subtasks.position ASC, subtasks.id ASC")
}

// preloadTaskAll loads Project, Assignee, and ordered Subtasks for a task query.
func preloadTaskAll(db *gorm.DB) *gorm.DB {
	return db.Preload("Project").Preload("Assignee").Preload("Subtasks", subtasksOrdered)
}

func unionUint(a, b []uint) []uint {
	seen := make(map[uint]struct{}, len(a)+len(b))
	out := make([]uint, 0, len(a)+len(b))
	for _, x := range a {
		if _, ok := seen[x]; ok {
			continue
		}
		seen[x] = struct{}{}
		out = append(out, x)
	}
	for _, x := range b {
		if _, ok := seen[x]; ok {
			continue
		}
		seen[x] = struct{}{}
		out = append(out, x)
	}
	return out
}

type TaskService struct {
	DB *gorm.DB
}

func (s *TaskService) ownedProjectIDs(userID uint) ([]uint, error) {
	var ids []uint
	err := s.DB.Model(&models.Project{}).Where("owner_id = ?", userID).Pluck("id", &ids).Error
	return ids, err
}

func (s *TaskService) memberProjectIDs(userID uint) ([]uint, error) {
	var ids []uint
	err := s.DB.Model(&models.ProjectMember{}).Where("user_id = ?", userID).Pluck("project_id", &ids).Error
	return ids, err
}

func (s *TaskService) visibleProjectIDs(userID uint) ([]uint, error) {
	owned, err := s.ownedProjectIDs(userID)
	if err != nil {
		return nil, err
	}
	memberIDs, err := s.memberProjectIDs(userID)
	if err != nil {
		return nil, err
	}
	return unionUint(owned, memberIDs), nil
}

func (s *TaskService) List(userID uint, role models.Role, projectID *uint, status *models.TaskStatus) ([]models.Task, error) {
	q := preloadTaskAll(s.DB.Model(&models.Task{}))
	if models.IsSystemRole(role) {
		// all tasks
	} else {
		visible, err := s.visibleProjectIDs(userID)
		if err != nil {
			return nil, err
		}
		if len(visible) > 0 {
			q = q.Where("project_id IN ? OR assignee_id = ?", visible, userID)
		} else {
			q = q.Where("assignee_id = ?", userID)
		}
	}

	if projectID != nil {
		q = q.Where("project_id = ?", *projectID)
	}
	if status != nil {
		q = q.Where("status = ?", *status)
	}

	var tasks []models.Task
	err := q.Order("updated_at desc").Find(&tasks).Error
	return tasks, err
}

func (s *TaskService) canAccessTask(task *models.Task, userID uint, role models.Role) bool {
	if models.IsSystemRole(role) {
		return true
	}
	if task.AssigneeID != nil && *task.AssigneeID == userID {
		return true
	}
	var p models.Project
	if err := s.DB.First(&p, task.ProjectID).Error; err != nil {
		return false
	}
	if p.OwnerID == userID {
		return true
	}
	var n int64
	if err := s.DB.Model(&models.ProjectMember{}).Where("project_id = ? AND user_id = ?", task.ProjectID, userID).Count(&n).Error; err != nil {
		return false
	}
	return n > 0
}

// CanManageProjectTasks is true for admin/staff, project owner, or manager member.
func (s *TaskService) CanManageProjectTasks(projectID, userID uint, role models.Role) (bool, error) {
	if models.IsSystemRole(role) {
		return true, nil
	}
	ok, err := s.isProjectOwner(projectID, userID)
	if err != nil || ok {
		return ok, err
	}
	var pm models.ProjectMember
	if err := s.DB.Select("role").Where("project_id = ? AND user_id = ?", projectID, userID).First(&pm).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return false, nil
		}
		return false, err
	}
	return pm.Role == models.ProjectRoleManager, nil
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

func (s *TaskService) Get(id, userID uint, role models.Role) (*models.Task, error) {
	var t models.Task
	if err := preloadTaskAll(s.DB).First(&t, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrTaskNotFound
		}
		return nil, err
	}
	if !s.canAccessTask(&t, userID, role) {
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

func (s *TaskService) Create(userID uint, role models.Role, in TaskCreate) (*models.Task, error) {
	if in.ProjectID == 0 {
		return nil, ErrInvalidInput
	}
	ok, err := s.CanManageProjectTasks(in.ProjectID, userID, role)
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

// executorAssigneeStatusOnly: executor member who is assignee may change status only (any transition).
func (s *TaskService) executorAssigneeStatusOnly(t *models.Task, userID uint, in TaskUpdate) bool {
	if in.Status == nil {
		return false
	}
	if in.Title != nil || in.Description != nil || in.Priority != nil || in.DueDate != nil || in.ProjectID != nil {
		return false
	}
	if t.AssigneeID == nil || *t.AssigneeID != userID {
		return false
	}
	var pm models.ProjectMember
	if err := s.DB.Select("role").Where("project_id = ? AND user_id = ?", t.ProjectID, userID).First(&pm).Error; err != nil {
		return false
	}
	return pm.Role == models.ProjectRoleExecutor
}

func (s *TaskService) Update(id, userID uint, role models.Role, in TaskUpdate) (*models.Task, error) {
	t, err := s.Get(id, userID, role)
	if err != nil {
		return nil, err
	}
	owner, err := s.CanManageProjectTasks(t.ProjectID, userID, role)
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
				ok, err := s.CanManageProjectTasks(newPID, userID, role)
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

	if s.executorAssigneeStatusOnly(t, userID, in) {
		t.Status = *in.Status
		if err := s.DB.Save(t).Error; err != nil {
			return nil, err
		}
		preloadTaskAll(s.DB).First(t, t.ID)
		return t, nil
	}

	return nil, ErrForbidden
}

func (s *TaskService) Delete(id, userID uint, role models.Role) error {
	t, err := s.Get(id, userID, role)
	if err != nil {
		return err
	}
	ok, err := s.CanManageProjectTasks(t.ProjectID, userID, role)
	if err != nil || !ok {
		if err == nil {
			err = ErrForbidden
		}
		return err
	}
	return s.DB.Delete(t).Error
}

func (s *TaskService) Assign(taskID, ownerUserID uint, role models.Role, assigneeID uint) (*models.Task, error) {
	t, err := s.Get(taskID, ownerUserID, role)
	if err != nil {
		return nil, err
	}
	ok, err := s.CanManageProjectTasks(t.ProjectID, ownerUserID, role)
	if err != nil || !ok {
		if err == nil {
			err = ErrForbidden
		}
		return nil, err
	}
	if assigneeID == 0 {
		// Explicitly set AssigneeID to NULL using Update (GORM doesn't zero values on Save by default)
		if err := s.DB.Model(&models.Task{}).Where("id = ?", t.ID).Update("assignee_id", nil).Error; err != nil {
			return nil, err
		}
		// Reload fresh data into a new variable to avoid stale associations
		var fresh models.Task
		if err := preloadTaskAll(s.DB).First(&fresh, t.ID).Error; err != nil {
			return nil, err
		}
		return &fresh, nil
	}
	var u models.User
	if err := s.DB.First(&u, assigneeID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrInvalidInput
		}
		return nil, err
	}
	ms := &ProjectMemberService{DB: s.DB}
	allowed, err := ms.AssigneeAllowedOnProject(t.ProjectID, assigneeID)
	if err != nil {
		return nil, err
	}
	if !allowed {
		return nil, ErrAssigneeNotProjectMember
	}
	// Clear old assignee association before saving new one
	t.Assignee = nil
	t.AssigneeID = &assigneeID
	if err := s.DB.Save(t).Error; err != nil {
		return nil, err
	}
	// Reload fresh data into a new variable to avoid stale associations
	var fresh models.Task
	if err := preloadTaskAll(s.DB).First(&fresh, t.ID).Error; err != nil {
		return nil, err
	}
	return &fresh, nil
}

func (s *TaskService) Complete(taskID, userID uint, role models.Role) (*models.Task, error) {
	t, err := s.Get(taskID, userID, role)
	if err != nil {
		return nil, err
	}
	owner, err := s.CanManageProjectTasks(t.ProjectID, userID, role)
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

// AttachCallerACL sets JSON-only ACL fields for the requesting user.
func (s *TaskService) AttachCallerACL(t *models.Task, uid uint, role models.Role) error {
	m, err := s.CanManageProjectTasks(t.ProjectID, uid, role)
	if err != nil {
		return err
	}
	t.CallerCanManage = m
	if m {
		t.CallerCanChangeStatus = true
		return nil
	}
	if t.AssigneeID != nil && *t.AssigneeID == uid {
		var pm models.ProjectMember
		if err := s.DB.Select("role").Where("project_id = ? AND user_id = ?", t.ProjectID, uid).First(&pm).Error; err == nil && pm.Role == models.ProjectRoleExecutor {
			t.CallerCanChangeStatus = true
			return nil
		}
	}
	t.CallerCanChangeStatus = false
	return nil
}

// AttachCallerACLBatch sets ACL on each task (same caller).
func (s *TaskService) AttachCallerACLBatch(tasks []models.Task, uid uint, role models.Role) error {
	for i := range tasks {
		if err := s.AttachCallerACL(&tasks[i], uid, role); err != nil {
			return err
		}
	}
	return nil
}
