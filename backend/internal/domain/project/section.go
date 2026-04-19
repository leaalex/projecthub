package project

import (
	"strings"
	"time"
)

// Section — колонка внутри проекта (общая для задач и заметок).
type Section struct {
	id        SectionID
	name      string
	position  int
	createdAt time.Time
	updatedAt time.Time
}

func ReconstituteSection(id SectionID, name string, position int, createdAt, updatedAt time.Time) *Section {
	return &Section{
		id:        id,
		name:      strings.TrimSpace(name),
		position:  position,
		createdAt: createdAt,
		updatedAt: updatedAt,
	}
}

func newSection(name string, position int, now time.Time) *Section {
	return &Section{
		name:      strings.TrimSpace(name),
		position:  position,
		createdAt: now,
		updatedAt: now,
	}
}

func (s *Section) ID() SectionID        { return s.id }
func (s *Section) Name() string        { return s.name }
func (s *Section) Position() int       { return s.position }
func (s *Section) CreatedAt() time.Time { return s.createdAt }
func (s *Section) UpdatedAt() time.Time { return s.updatedAt }

func (s *Section) AssignID(id SectionID) { s.id = id }

func (s *Section) Rename(name string, now time.Time) error {
	name = strings.TrimSpace(name)
	if name == "" {
		return ErrInvalidSectionName
	}
	s.name = name
	s.updatedAt = now
	return nil
}

func (s *Section) setPosition(pos int, now time.Time) {
	s.position = pos
	s.updatedAt = now
}
