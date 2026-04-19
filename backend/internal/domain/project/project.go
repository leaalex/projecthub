package project

import (
	"strings"
	"time"

	"task-manager/backend/internal/domain/user"
)

// Project — корень агрегата: проект, участники, секции задач и секции заметок.
type Project struct {
	id           ID
	name         string
	description  string
	kind         Kind
	ownerID      user.ID
	members      []*Member
	sections     []*Section
	noteSections []*NoteSection
	createdAt    time.Time
	updatedAt    time.Time
}

// NewProject создаёт новый проект (ещё без id в БД).
func NewProject(ownerID user.ID, creatorRole user.Role, name, description string, kind Kind) (*Project, error) {
	name = strings.TrimSpace(name)
	if name == "" {
		return nil, ErrInvalidProjectName
	}
	if kind == "" {
		return nil, ErrForbidden
	}
	if kind == KindTeam && creatorRole == user.RoleUser {
		return nil, ErrTeamProjectNotAllowed
	}
	return &Project{
		name:         name,
		description:  description,
		kind:         kind,
		ownerID:      ownerID,
		members:      nil,
		sections:     nil,
		noteSections: nil,
	}, nil
}

// Reconstitute восстанавливает проект из хранилища.
func Reconstitute(
	id ID,
	name, description string,
	kind Kind,
	ownerID user.ID,
	members []*Member,
	sections []*Section,
	noteSections []*NoteSection,
	createdAt, updatedAt time.Time,
) *Project {
	return &Project{
		id:           id,
		name:         name,
		description:  description,
		kind:         kind,
		ownerID:      ownerID,
		members:      members,
		sections:     sections,
		noteSections: noteSections,
		createdAt:    createdAt,
		updatedAt:    updatedAt,
	}
}

func (p *Project) ID() ID               { return p.id }
func (p *Project) Name() string         { return p.name }
func (p *Project) Description() string  { return p.description }
func (p *Project) Kind() Kind           { return p.kind }
func (p *Project) OwnerID() user.ID     { return p.ownerID }
func (p *Project) Members() []*Member   { return p.members }
func (p *Project) Sections() []*Section { return p.sections }
func (p *Project) NoteSections() []*NoteSection { return p.noteSections }
func (p *Project) CreatedAt() time.Time { return p.createdAt }
func (p *Project) UpdatedAt() time.Time { return p.updatedAt }

func (p *Project) AssignID(id ID) { p.id = id }

func (p *Project) Touch(now time.Time) {
	if p.createdAt.IsZero() {
		p.createdAt = now
	}
	p.updatedAt = now
}

func (p *Project) Rename(name string, now time.Time) error {
	name = strings.TrimSpace(name)
	if name == "" {
		return ErrInvalidProjectName
	}
	p.name = name
	p.Touch(now)
	return nil
}

func (p *Project) UpdateDescription(text string, now time.Time) {
	p.description = text
	p.Touch(now)
}

// AddMember добавляет участника (не владельца).
func (p *Project) AddMember(uid user.ID, role Role, now time.Time) (*Member, error) {
	if p.kind.IsPersonal() {
		return nil, ErrPersonalNoMembers
	}
	if uid == p.ownerID {
		return nil, ErrForbidden
	}
	if !role.IsValid() {
		return nil, ErrInvalidMemberRole
	}
	if p.findMemberByUser(uid) != nil {
		return nil, ErrAlreadyMember
	}
	m := newMember(uid, role, now)
	p.members = append(p.members, m)
	p.Touch(now)
	return m, nil
}

// UpdateMemberRole меняет роль участника.
func (p *Project) UpdateMemberRole(uid user.ID, role Role, now time.Time) error {
	if p.kind.IsPersonal() {
		return ErrPersonalNoMembers
	}
	if uid == p.ownerID {
		return ErrForbidden
	}
	m := p.findMemberByUser(uid)
	if m == nil {
		return ErrNotMember
	}
	if err := m.ChangeRole(role, now); err != nil {
		return err
	}
	p.Touch(now)
	return nil
}

// RemoveMember удаляет участника по user id.
func (p *Project) RemoveMember(uid user.ID, now time.Time) error {
	if uid == p.ownerID {
		return ErrCannotRemoveOwner
	}
	idx := p.memberIndexByUser(uid)
	if idx < 0 {
		return ErrNotMember
	}
	p.members = append(p.members[:idx], p.members[idx+1:]...)
	p.Touch(now)
	return nil
}

// TransferOwnership передаёт владение; прежний владелец становится менеджером-участником.
func (p *Project) TransferOwnership(newOwner user.ID, now time.Time) error {
	if newOwner == p.ownerID {
		return ErrOwnershipUnchanged
	}
	old := p.ownerID
	if p.findMemberByUser(old) == nil {
		m := newMember(old, RoleManager, now)
		p.members = append(p.members, m)
	} else {
		_ = p.findMemberByUser(old).ChangeRole(RoleManager, now)
	}
	if idx := p.memberIndexByUser(newOwner); idx >= 0 {
		p.members = append(p.members[:idx], p.members[idx+1:]...)
	}
	p.ownerID = newOwner
	p.Touch(now)
	return nil
}

// AddSection добавляет секцию в конец (position = max+1).
func (p *Project) AddSection(name string, now time.Time) (*Section, error) {
	name = strings.TrimSpace(name)
	if name == "" {
		return nil, ErrInvalidSectionName
	}
	maxPos := 0
	for _, s := range p.sections {
		if s.Position() > maxPos {
			maxPos = s.Position()
		}
	}
	sec := newSection(name, maxPos+1, now)
	p.sections = append(p.sections, sec)
	p.Touch(now)
	return sec, nil
}

// RenameSection переименовывает секцию.
func (p *Project) RenameSection(id SectionID, name string, now time.Time) error {
	s := p.findSection(id)
	if s == nil {
		return ErrSectionNotFound
	}
	if err := s.Rename(name, now); err != nil {
		return err
	}
	p.Touch(now)
	return nil
}

// ReorderSections задаёт порядок секций (полный список id без дубликатов).
func (p *Project) ReorderSections(order []SectionID, now time.Time) error {
	if len(order) == 0 {
		return ErrInvalidReorder
	}
	if len(order) != len(p.sections) {
		return ErrInvalidReorder
	}
	seen := make(map[SectionID]struct{}, len(order))
	for _, id := range order {
		if _, dup := seen[id]; dup {
			return ErrInvalidReorder
		}
		seen[id] = struct{}{}
		if p.findSection(id) == nil {
			return ErrInvalidReorder
		}
	}
	for i, id := range order {
		p.findSection(id).setPosition(i+1, now)
	}
	p.Touch(now)
	return nil
}

// RemoveSection удаляет секцию из агрегата и перенумерует позиции.
func (p *Project) RemoveSection(id SectionID, now time.Time) error {
	idx := p.sectionIndex(id)
	if idx < 0 {
		return ErrSectionNotFound
	}
	p.sections = append(p.sections[:idx], p.sections[idx+1:]...)
	for i, s := range p.sections {
		s.setPosition(i+1, now)
	}
	p.Touch(now)
	return nil
}

// SectionByID возвращает секцию по идентификатору.
func (p *Project) SectionByID(id SectionID) *Section {
	return p.findSection(id)
}

func (p *Project) findMemberByUser(uid user.ID) *Member {
	for _, m := range p.members {
		if m.UserID() == uid {
			return m
		}
	}
	return nil
}

func (p *Project) memberIndexByUser(uid user.ID) int {
	for i, m := range p.members {
		if m.UserID() == uid {
			return i
		}
	}
	return -1
}

func (p *Project) findSection(id SectionID) *Section {
	for _, s := range p.sections {
		if s.ID() == id {
			return s
		}
	}
	return nil
}

func (p *Project) sectionIndex(id SectionID) int {
	for i, s := range p.sections {
		if s.ID() == id {
			return i
		}
	}
	return -1
}

// AddNoteSection добавляет секцию заметок в конец (position = max+1).
func (p *Project) AddNoteSection(name string, now time.Time) (*NoteSection, error) {
	name = strings.TrimSpace(name)
	if name == "" {
		return nil, ErrInvalidSectionName
	}
	maxPos := 0
	for _, s := range p.noteSections {
		if s.Position() > maxPos {
			maxPos = s.Position()
		}
	}
	sec := newNoteSection(name, maxPos+1, now)
	p.noteSections = append(p.noteSections, sec)
	p.Touch(now)
	return sec, nil
}

// RenameNoteSection переименовывает секцию заметок.
func (p *Project) RenameNoteSection(id NoteSectionID, name string, now time.Time) error {
	s := p.findNoteSection(id)
	if s == nil {
		return ErrNoteSectionNotFound
	}
	if err := s.Rename(name, now); err != nil {
		return err
	}
	p.Touch(now)
	return nil
}

// ReorderNoteSections задаёт порядок секций заметок (полный список id без дубликатов).
func (p *Project) ReorderNoteSections(order []NoteSectionID, now time.Time) error {
	if len(order) == 0 {
		return ErrInvalidReorder
	}
	if len(order) != len(p.noteSections) {
		return ErrInvalidReorder
	}
	seen := make(map[NoteSectionID]struct{}, len(order))
	for _, id := range order {
		if _, dup := seen[id]; dup {
			return ErrInvalidReorder
		}
		seen[id] = struct{}{}
		if p.findNoteSection(id) == nil {
			return ErrInvalidReorder
		}
	}
	for i, id := range order {
		p.findNoteSection(id).setNoteSectionPosition(i+1, now)
	}
	p.Touch(now)
	return nil
}

// RemoveNoteSection удаляет секцию заметок из агрегата и перенумерует позиции.
func (p *Project) RemoveNoteSection(id NoteSectionID, now time.Time) error {
	idx := p.noteSectionIndex(id)
	if idx < 0 {
		return ErrNoteSectionNotFound
	}
	p.noteSections = append(p.noteSections[:idx], p.noteSections[idx+1:]...)
	for i, s := range p.noteSections {
		s.setNoteSectionPosition(i+1, now)
	}
	p.Touch(now)
	return nil
}

// NoteSectionByID возвращает секцию заметок по идентификатору.
func (p *Project) NoteSectionByID(id NoteSectionID) *NoteSection {
	return p.findNoteSection(id)
}

func (p *Project) findNoteSection(id NoteSectionID) *NoteSection {
	for _, s := range p.noteSections {
		if s.ID() == id {
			return s
		}
	}
	return nil
}

func (p *Project) noteSectionIndex(id NoteSectionID) int {
	for i, s := range p.noteSections {
		if s.ID() == id {
			return i
		}
	}
	return -1
}
