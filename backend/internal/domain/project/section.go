package project

import (
	"strings"
	"time"
)

// Section — колонка/секция задач внутри проекта.
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
func (s *Section) Name() string         { return s.name }
func (s *Section) Position() int        { return s.position }
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

// NoteSection — колонка/секция заметок внутри проекта (отдельно от task_sections).
type NoteSection struct {
	id        NoteSectionID
	name      string
	position  int
	createdAt time.Time
	updatedAt time.Time
}

// ReconstituteNoteSection восстанавливает секцию заметок из хранилища.
func ReconstituteNoteSection(id NoteSectionID, name string, position int, createdAt, updatedAt time.Time) *NoteSection {
	return &NoteSection{
		id:        id,
		name:      strings.TrimSpace(name),
		position:  position,
		createdAt: createdAt,
		updatedAt: updatedAt,
	}
}

func newNoteSection(name string, position int, now time.Time) *NoteSection {
	return &NoteSection{
		name:      strings.TrimSpace(name),
		position:  position,
		createdAt: now,
		updatedAt: now,
	}
}

func (s *NoteSection) ID() NoteSectionID        { return s.id }
func (s *NoteSection) Name() string             { return s.name }
func (s *NoteSection) Position() int            { return s.position }
func (s *NoteSection) CreatedAt() time.Time     { return s.createdAt }
func (s *NoteSection) UpdatedAt() time.Time     { return s.updatedAt }
func (s *NoteSection) AssignID(id NoteSectionID) { s.id = id }

func (s *NoteSection) Rename(name string, now time.Time) error {
	name = strings.TrimSpace(name)
	if name == "" {
		return ErrInvalidSectionName
	}
	s.name = name
	s.updatedAt = now
	return nil
}

func (s *NoteSection) setNoteSectionPosition(pos int, now time.Time) {
	s.position = pos
	s.updatedAt = now
}
