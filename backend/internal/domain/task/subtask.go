package task

import (
	"strings"
	"time"
)

// Subtask — сущность внутри агрегата Task.
type Subtask struct {
	id        SubtaskID
	title     string
	done      bool
	position  int
	createdAt time.Time
	updatedAt time.Time
}

// NewSubtask создаёт подзадачу без id (до сохранения).
func NewSubtask(title string, position int, now time.Time) (*Subtask, error) {
	title = strings.TrimSpace(title)
	if title == "" {
		return nil, ErrInvalidTitle
	}
	return &Subtask{
		title:     title,
		position:  position,
		createdAt: now,
		updatedAt: now,
	}, nil
}

// ReconstituteSubtask восстанавливает подзадачу из хранилища.
func ReconstituteSubtask(id SubtaskID, title string, done bool, position int, createdAt, updatedAt time.Time) *Subtask {
	return &Subtask{
		id:        id,
		title:     title,
		done:      done,
		position:  position,
		createdAt: createdAt,
		updatedAt: updatedAt,
	}
}

func (s *Subtask) ID() SubtaskID        { return s.id }
func (s *Subtask) Title() string        { return s.title }
func (s *Subtask) Done() bool           { return s.done }
func (s *Subtask) Position() int        { return s.position }
func (s *Subtask) CreatedAt() time.Time { return s.createdAt }
func (s *Subtask) UpdatedAt() time.Time { return s.updatedAt }

func (s *Subtask) AssignID(id SubtaskID) { s.id = id }

func (s *Subtask) touch(now time.Time) {
	if s.createdAt.IsZero() {
		s.createdAt = now
	}
	s.updatedAt = now
}

// Rename переименовывает подзадачу.
func (s *Subtask) Rename(name string, now time.Time) error {
	name = strings.TrimSpace(name)
	if name == "" {
		return ErrInvalidTitle
	}
	s.title = name
	s.touch(now)
	return nil
}

// Toggle инвертирует флаг выполнения.
func (s *Subtask) Toggle(now time.Time) {
	s.done = !s.done
	s.touch(now)
}

// SetPosition задаёт позицию сортировки.
func (s *Subtask) SetPosition(pos int, now time.Time) {
	s.position = pos
	s.touch(now)
}

// MarkDone явно выставляет флаг выполнения.
func (s *Subtask) MarkDone(done bool, now time.Time) {
	s.done = done
	s.touch(now)
}
