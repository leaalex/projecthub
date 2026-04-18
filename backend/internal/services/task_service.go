package services

import (
	"errors"
	"strings"
	"time"

	"task-manager/backend/internal/models"

	"gorm.io/gorm"
)

var ErrTaskNotFound = errors.New("task not found")

// ErrAssigneeNotProjectMember возвращается при назначении пользователя, не являющегося владельцем или участником проекта.
var ErrAssigneeNotProjectMember = errors.New("assignee must be project owner or member")
var ErrTaskSectionNotFound = errors.New("task section not found")

// subtasksOrdered — GORM-скоуп для стабильной сортировки подзадач при Preload.
func subtasksOrdered(db *gorm.DB) *gorm.DB {
	return db.Order("subtasks.position ASC, subtasks.id ASC")
}

// preloadTaskAll загружает Project, Assignee и упорядоченные Subtasks для запроса задачи.
func preloadTaskAll(db *gorm.DB) *gorm.DB {
	return db.Preload("Project").Preload("Section").Preload("Assignee").Preload("Subtasks", subtasksOrdered)
}

func orderedTaskQuery(db *gorm.DB) *gorm.DB {
	return db.Order("COALESCE(section_id, 0) ASC").Order("position ASC").Order("updated_at DESC").Order("id ASC")
}

func applySectionFilter(db *gorm.DB, sectionID *uint) *gorm.DB {
	if sectionID == nil {
		return db.Where("section_id IS NULL")
	}
	return db.Where("section_id = ?", *sectionID)
}

func (s *TaskService) ensureSectionInProject(projectID uint, sectionID *uint) error {
	if sectionID == nil {
		return nil
	}
	var sec models.TaskSection
	if err := s.DB.Select("id", "project_id").First(&sec, *sectionID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrTaskSectionNotFound
		}
		return err
	}
	if sec.ProjectID != projectID {
		return ErrTaskSectionNotFound
	}
	return nil
}

func (s *TaskService) nextTaskPosition(tx *gorm.DB, projectID uint, sectionID *uint) (int, error) {
	query := tx.Model(&models.Task{}).Where("project_id = ?", projectID)
	query = applySectionFilter(query, sectionID)
	var maxPos int
	if err := query.Select("COALESCE(MAX(position), 0)").Scan(&maxPos).Error; err != nil {
		return 0, err
	}
	return maxPos + 1, nil
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
		// все задачи
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
	err := orderedTaskQuery(q).Find(&tasks).Error
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

// CanManageProjectTasks возвращает true для admin/staff, владельца проекта или участника с ролью менеджера.
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

// IsProjectOwner сообщает, является ли userID владельцем проекта.
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
	SectionID   *uint
	Status      models.TaskStatus
	Priority    models.TaskPriority
	DueDate     *string // ISO-дата, необязательна
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
	if err := s.ensureSectionInProject(in.ProjectID, in.SectionID); err != nil {
		return nil, err
	}
	nextPos, err := s.nextTaskPosition(s.DB, in.ProjectID, in.SectionID)
	if err != nil {
		return nil, err
	}
	t := models.Task{
		Title:       title,
		Description: in.Description,
		ProjectID:   in.ProjectID,
		SectionID:   in.SectionID,
		Position:    nextPos,
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

// executorAssigneeStatusOnly: участник-исполнитель, являющийся назначенным, может изменять только статус (любой переход).
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
				// Секция принадлежит проекту; сбрасываем при перемещении задачи в другой проект.
				t.SectionID = nil
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

type TaskMoveInput struct {
	TaskID    uint
	ProjectID uint
	SectionID *uint
	Position  *int
}

// Move изменяет секцию задачи и переупорядочивает по позиции внутри целевой секции.
func (s *TaskService) Move(userID uint, role models.Role, in TaskMoveInput) (*models.Task, error) {
	if in.TaskID == 0 || in.ProjectID == 0 {
		return nil, ErrInvalidInput
	}
	t, err := s.Get(in.TaskID, userID, role)
	if err != nil {
		return nil, err
	}
	if t.ProjectID != in.ProjectID {
		return nil, ErrForbidden
	}
	ok, err := s.CanManageProjectTasks(t.ProjectID, userID, role)
	if err != nil {
		return nil, err
	}
	if !ok {
		return nil, ErrForbidden
	}
	if err := s.ensureSectionInProject(t.ProjectID, in.SectionID); err != nil {
		return nil, err
	}

	tx := s.DB.Begin()
	if tx.Error != nil {
		return nil, tx.Error
	}
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	var siblings []models.Task
	sq := tx.Where("project_id = ?", t.ProjectID).Where("id <> ?", t.ID)
	sq = applySectionFilter(sq, in.SectionID)
	if err := sq.Order("position ASC, id ASC").Find(&siblings).Error; err != nil {
		tx.Rollback()
		return nil, err
	}

	insertPos := len(siblings)
	if in.Position != nil {
		if *in.Position < 0 {
			tx.Rollback()
			return nil, ErrInvalidInput
		}
		if *in.Position < insertPos {
			insertPos = *in.Position
		}
	}

	currentSection := t.SectionID
	t.SectionID = in.SectionID

	ordered := make([]models.Task, 0, len(siblings)+1)
	ordered = append(ordered, siblings[:insertPos]...)
	ordered = append(ordered, *t)
	ordered = append(ordered, siblings[insertPos:]...)

	for idx := range ordered {
		ordered[idx].Position = idx + 1
		if err := tx.Model(&models.Task{}).
			Where("id = ?", ordered[idx].ID).
			Updates(map[string]any{
				"section_id": ordered[idx].SectionID,
				"position":   ordered[idx].Position,
			}).Error; err != nil {
			tx.Rollback()
			return nil, err
		}
	}

	// Перебалансируем старую секцию после перемещения задачи из неё.
	sameSection := (currentSection == nil && in.SectionID == nil) ||
		(currentSection != nil && in.SectionID != nil && *currentSection == *in.SectionID)
	if !sameSection {
		var old []models.Task
		oq := tx.Where("project_id = ?", t.ProjectID).Where("id <> ?", t.ID)
		oq = applySectionFilter(oq, currentSection)
		if err := oq.Order("position ASC, id ASC").Find(&old).Error; err != nil {
			tx.Rollback()
			return nil, err
		}
		for idx := range old {
			if err := tx.Model(&models.Task{}).
				Where("id = ?", old[idx].ID).
				Update("position", idx+1).Error; err != nil {
				tx.Rollback()
				return nil, err
			}
		}
	}

	if err := tx.Commit().Error; err != nil {
		return nil, err
	}

	var fresh models.Task
	if err := preloadTaskAll(s.DB).First(&fresh, t.ID).Error; err != nil {
		return nil, err
	}
	return &fresh, nil
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
	// SQLite не обеспечивает каскадное удаление по FK даже с тегами constraint, поэтому
	// подзадачи удаляются явно внутри транзакции перед удалением самой задачи.
	return s.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("task_id = ?", id).Delete(&models.Subtask{}).Error; err != nil {
			return err
		}
		return tx.Delete(t).Error
	})
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
		// Явно устанавливаем AssigneeID в NULL через Update (GORM не обнуляет значения через Save по умолчанию)
		if err := s.DB.Model(&models.Task{}).Where("id = ?", t.ID).Update("assignee_id", nil).Error; err != nil {
			return nil, err
		}
		// Перечитываем свежие данные в новую переменную, чтобы избежать устаревших ассоциаций
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
	// Сбрасываем старую ассоциацию назначенного перед сохранением новой
	t.Assignee = nil
	t.AssigneeID = &assigneeID
	if err := s.DB.Save(t).Error; err != nil {
		return nil, err
	}
	// Перечитываем свежие данные в новую переменную, чтобы избежать устаревших ассоциаций
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

// AttachCallerACL устанавливает JSON-only ACL-поля для запрашивающего пользователя.
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

// AttachCallerACLBatch устанавливает ACL для каждой задачи (один и тот же вызывающий).
func (s *TaskService) AttachCallerACLBatch(tasks []models.Task, uid uint, role models.Role) error {
	for i := range tasks {
		if err := s.AttachCallerACL(&tasks[i], uid, role); err != nil {
			return err
		}
	}
	return nil
}
