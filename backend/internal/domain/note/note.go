package note

import (
	"strings"
	"time"

	"task-manager/backend/internal/domain/project"
	"task-manager/backend/internal/domain/user"
)

// Note — корень агрегата Note.
type Note struct {
	id        ID
	projectID project.ID
	sectionID *project.SectionID
	authorID  user.ID
	title     string
	body      string
	position  int
	createdAt time.Time
	updatedAt time.Time
}

// NewNote создаёт новую заметку (без id до первого Save).
func NewNote(
	projectID project.ID,
	sectionID *project.SectionID,
	authorID user.ID,
	title, body string,
	position int,
	now time.Time,
) (*Note, error) {
	title = strings.TrimSpace(title)
	if title == "" {
		return nil, ErrTitleRequired
	}
	return &Note{
		projectID: projectID,
		sectionID: sectionID,
		authorID:  authorID,
		title:     title,
		body:      body,
		position:  position,
		createdAt: now,
		updatedAt: now,
	}, nil
}

// Reconstitute восстанавливает заметку из хранилища.
func Reconstitute(
	id ID,
	projectID project.ID,
	sectionID *project.SectionID,
	authorID user.ID,
	title, body string,
	position int,
	createdAt, updatedAt time.Time,
) *Note {
	return &Note{
		id:        id,
		projectID: projectID,
		sectionID: sectionID,
		authorID:  authorID,
		title:     title,
		body:      body,
		position:  position,
		createdAt: createdAt,
		updatedAt: updatedAt,
	}
}

func (n *Note) ID() ID                        { return n.id }
func (n *Note) ProjectID() project.ID         { return n.projectID }
func (n *Note) SectionID() *project.SectionID { return n.sectionID }
func (n *Note) AuthorID() user.ID             { return n.authorID }
func (n *Note) Title() string                 { return n.title }
func (n *Note) Body() string                  { return n.body }
func (n *Note) Position() int                 { return n.position }
func (n *Note) CreatedAt() time.Time          { return n.createdAt }
func (n *Note) UpdatedAt() time.Time          { return n.updatedAt }

// AssignID присваивает идентификатор после первого сохранения.
func (n *Note) AssignID(id ID) { n.id = id }

// Touch обновляет метку времени.
func (n *Note) Touch(now time.Time) {
	if n.createdAt.IsZero() {
		n.createdAt = now
	}
	n.updatedAt = now
}

// Rename переименовывает заметку.
func (n *Note) Rename(title string, now time.Time) error {
	title = strings.TrimSpace(title)
	if title == "" {
		return ErrTitleRequired
	}
	n.title = title
	n.Touch(now)
	return nil
}

// SetBody обновляет markdown-содержимое.
func (n *Note) SetBody(body string, now time.Time) {
	n.body = body
	n.Touch(now)
}

// MoveToSection перемещает заметку в секцию/позицию.
func (n *Note) MoveToSection(sectionID *project.SectionID, position int, now time.Time) {
	n.sectionID = sectionID
	n.position = position
	n.Touch(now)
}

// SetPosition задаёт позицию (используется сервисом порядка).
func (n *Note) SetPosition(pos int, now time.Time) {
	n.position = pos
	n.Touch(now)
}
