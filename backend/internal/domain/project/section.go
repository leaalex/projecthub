package project

import (
	"strings"
	"time"
)

// SectionDisplayMode — как отображается заголовок секции (серверное свойство, одинаково для всех).
type SectionDisplayMode string

const (
	SectionDisplayPlain    SectionDisplayMode = "plain"
	SectionDisplayProgress SectionDisplayMode = "progress"
)

// ParseSectionDisplayMode нормализует строку БД/JSON. Пустая строка → plain.
func ParseSectionDisplayMode(s string) (SectionDisplayMode, error) {
	s = strings.TrimSpace(s)
	if s == "" {
		return SectionDisplayPlain, nil
	}
	m := SectionDisplayMode(s)
	if err := m.validate(); err != nil {
		return "", err
	}
	return m, nil
}

func (m SectionDisplayMode) validate() error {
	switch m {
	case SectionDisplayPlain, SectionDisplayProgress:
		return nil
	default:
		return ErrInvalidSectionDisplayMode
	}
}

// Section — колонка внутри проекта (общая для задач и заметок).
type Section struct {
	id           SectionID
	name         string
	position     int
	displayMode  SectionDisplayMode
	createdAt    time.Time
	updatedAt    time.Time
}

func ReconstituteSection(id SectionID, name string, position int, displayMode SectionDisplayMode, createdAt, updatedAt time.Time) *Section {
	if err := displayMode.validate(); err != nil {
		displayMode = SectionDisplayPlain
	}
	return &Section{
		id:          id,
		name:        strings.TrimSpace(name),
		position:    position,
		displayMode: displayMode,
		createdAt:   createdAt,
		updatedAt:   updatedAt,
	}
}

func newSection(name string, position int, displayMode SectionDisplayMode, now time.Time) *Section {
	if err := displayMode.validate(); err != nil {
		displayMode = SectionDisplayPlain
	}
	return &Section{
		name:        strings.TrimSpace(name),
		position:    position,
		displayMode: displayMode,
		createdAt:   now,
		updatedAt:   now,
	}
}

func (s *Section) ID() SectionID         { return s.id }
func (s *Section) Name() string         { return s.name }
func (s *Section) Position() int        { return s.position }
func (s *Section) DisplayMode() SectionDisplayMode { return s.displayMode }
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

func (s *Section) setDisplayMode(mode SectionDisplayMode, now time.Time) error {
	if err := mode.validate(); err != nil {
		return err
	}
	s.displayMode = mode
	s.updatedAt = now
	return nil
}

func (s *Section) setPosition(pos int, now time.Time) {
	s.position = pos
	s.updatedAt = now
}
