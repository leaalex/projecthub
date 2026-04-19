package task

import (
	"strings"
	"time"

	"task-manager/backend/internal/domain/project"
	"task-manager/backend/internal/domain/user"
)

// Task — корень агрегата Task (+ Subtasks).
type Task struct {
	id          ID
	projectID   project.ID
	sectionID   *project.SectionID
	assigneeID  *user.ID
	title       string
	description string
	status      Status
	priority    Priority
	position    int
	dueDate     *time.Time
	subtasks    []*Subtask
	createdAt   time.Time
	updatedAt   time.Time
}

// NewTask создаёт задачу (ещё без id до сохранения).
func NewTask(
	projectID project.ID,
	sectionID *project.SectionID,
	title, description string,
	status Status,
	priority Priority,
	position int,
	dueDate *time.Time,
	now time.Time,
) (*Task, error) {
	title = strings.TrimSpace(title)
	if title == "" {
		return nil, ErrInvalidTitle
	}
	if !status.IsValid() {
		return nil, ErrInvalidStatus
	}
	if !priority.IsValid() {
		return nil, ErrInvalidPriority
	}
	return &Task{
		projectID:   projectID,
		sectionID:   sectionID,
		title:       title,
		description: description,
		status:      status,
		priority:    priority,
		position:    position,
		dueDate:     dueDate,
		subtasks:    nil,
		createdAt:   now,
		updatedAt:   now,
	}, nil
}

// Reconstitute восстанавливает задачу из хранилища.
func Reconstitute(
	id ID,
	projectID project.ID,
	sectionID *project.SectionID,
	assigneeID *user.ID,
	title, description string,
	status Status,
	priority Priority,
	position int,
	dueDate *time.Time,
	subtasks []*Subtask,
	createdAt, updatedAt time.Time,
) *Task {
	return &Task{
		id:          id,
		projectID:   projectID,
		sectionID:   sectionID,
		assigneeID:  assigneeID,
		title:       title,
		description: description,
		status:      status,
		priority:    priority,
		position:    position,
		dueDate:     dueDate,
		subtasks:    subtasks,
		createdAt:   createdAt,
		updatedAt:   updatedAt,
	}
}

func (t *Task) ID() ID                        { return t.id }
func (t *Task) ProjectID() project.ID         { return t.projectID }
func (t *Task) SectionID() *project.SectionID { return t.sectionID }
func (t *Task) AssigneeID() *user.ID          { return t.assigneeID }
func (t *Task) Title() string                 { return t.title }
func (t *Task) Description() string           { return t.description }
func (t *Task) Status() Status                { return t.status }
func (t *Task) Priority() Priority            { return t.priority }
func (t *Task) Position() int                 { return t.position }
func (t *Task) DueDate() *time.Time           { return t.dueDate }
func (t *Task) Subtasks() []*Subtask          { return t.subtasks }
func (t *Task) CreatedAt() time.Time          { return t.createdAt }
func (t *Task) UpdatedAt() time.Time          { return t.updatedAt }

func (t *Task) AssignID(id ID) { t.id = id }

// Touch обновляет метку времени изменения.
func (t *Task) Touch(now time.Time) {
	if t.createdAt.IsZero() {
		t.createdAt = now
	}
	t.updatedAt = now
}

// UpdateDetails применяет частичное обновление полей (nil = без изменений).
// Если dueDateSet == true, поле dueDate заменяется значением dueDate (в т.ч. на nil для сброса).
func (t *Task) UpdateDetails(title, description *string, status *Status, priority *Priority, dueDateSet bool, dueDate *time.Time, now time.Time) error {
	if title != nil {
		v := strings.TrimSpace(*title)
		if v == "" {
			return ErrInvalidTitle
		}
		t.title = v
	}
	if description != nil {
		t.description = *description
	}
	if status != nil {
		if !status.IsValid() {
			return ErrInvalidStatus
		}
		t.status = *status
	}
	if priority != nil {
		if !priority.IsValid() {
			return ErrInvalidPriority
		}
		t.priority = *priority
	}
	if dueDateSet {
		t.dueDate = dueDate
	}
	t.Touch(now)
	return nil
}

// ChangeStatus меняет статус.
func (t *Task) ChangeStatus(st Status, now time.Time) error {
	if !st.IsValid() {
		return ErrInvalidStatus
	}
	t.status = st
	t.Touch(now)
	return nil
}

// MoveToSection задаёт секцию и позицию (проверка проекта — снаружи).
func (t *Task) MoveToSection(sectionID *project.SectionID, position int, now time.Time) {
	t.sectionID = sectionID
	t.position = position
	t.Touch(now)
}

// MoveToProject переносит в другой проект; при sectionID == nil секция сбрасывается.
func (t *Task) MoveToProject(newProjectID project.ID, sectionID *project.SectionID, position int, now time.Time) {
	t.projectID = newProjectID
	if sectionID == nil {
		t.sectionID = nil
	} else {
		t.sectionID = sectionID
	}
	t.position = position
	t.Touch(now)
}

// Assign задаёт или снимает назначенного (допустимость — снаружи).
func (t *Task) Assign(userID *user.ID, now time.Time) {
	t.assigneeID = userID
	t.Touch(now)
}

// Unassign снимает назначение.
func (t *Task) Unassign(now time.Time) {
	t.assigneeID = nil
	t.Touch(now)
}

// Complete помечает задачу выполненной.
func (t *Task) Complete(now time.Time) error {
	return t.ChangeStatus(StatusDone, now)
}

func (t *Task) findSubtask(id SubtaskID) *Subtask {
	for _, s := range t.subtasks {
		if s != nil && s.ID() == id {
			return s
		}
	}
	return nil
}

// SubtaskByID возвращает подзадачу или nil.
func (t *Task) SubtaskByID(id SubtaskID) *Subtask {
	return t.findSubtask(id)
}

func (t *Task) maxSubtaskPosition() int {
	max := 0
	for _, s := range t.subtasks {
		if s != nil && s.Position() > max {
			max = s.Position()
		}
	}
	return max
}

// AddSubtask добавляет подзадачу в конец (автопозиция max+1).
func (t *Task) AddSubtask(title string, now time.Time) (*Subtask, error) {
	next := t.maxSubtaskPosition() + 1
	st, err := NewSubtask(title, next, now)
	if err != nil {
		return nil, err
	}
	t.subtasks = append(t.subtasks, st)
	t.Touch(now)
	return st, nil
}

// ToggleSubtask переключает done у подзадачи.
func (t *Task) ToggleSubtask(id SubtaskID, now time.Time) error {
	s := t.findSubtask(id)
	if s == nil {
		return ErrSubtaskNotFound
	}
	s.Toggle(now)
	t.Touch(now)
	return nil
}

// RenameSubtask переименовывает подзадачу.
func (t *Task) RenameSubtask(id SubtaskID, title string, now time.Time) error {
	s := t.findSubtask(id)
	if s == nil {
		return ErrSubtaskNotFound
	}
	if err := s.Rename(title, now); err != nil {
		return err
	}
	t.Touch(now)
	return nil
}

// SetSubtaskPosition задаёт позицию подзадачи.
func (t *Task) SetSubtaskPosition(id SubtaskID, pos int, now time.Time) error {
	s := t.findSubtask(id)
	if s == nil {
		return ErrSubtaskNotFound
	}
	s.SetPosition(pos, now)
	t.Touch(now)
	return nil
}

// RemoveSubtask удаляет подзадачу из агрегата.
func (t *Task) RemoveSubtask(id SubtaskID, now time.Time) error {
	for i, s := range t.subtasks {
		if s != nil && s.ID() == id {
			t.subtasks = append(t.subtasks[:i], t.subtasks[i+1:]...)
			t.Touch(now)
			return nil
		}
	}
	return ErrSubtaskNotFound
}

// SetPosition выставляет позицию задачи в списке (для Move-сервиса).
func (t *Task) SetPosition(pos int, now time.Time) {
	t.position = pos
	t.Touch(now)
}

// SetSectionID выставляет секцию (для Move-сервиса).
func (t *Task) SetSectionID(sectionID *project.SectionID, now time.Time) {
	t.sectionID = sectionID
	t.Touch(now)
}
