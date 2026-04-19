package projectstore

import (
	"fmt"

	"task-manager/backend/internal/domain/project"
	"task-manager/backend/internal/domain/user"
)

func recordToDomain(pr *ProjectRecord, memRows []MemberRecord, secRows []SectionRecord, noteSecRows []NoteSectionRecord) (*project.Project, error) {
	kind, err := project.ParseKind(pr.Kind)
	if err != nil {
		return nil, fmt.Errorf("project %d kind: %w", pr.ID, err)
	}
	members := make([]*project.Member, 0, len(memRows))
	for i := range memRows {
		m := &memRows[i]
		role, err := project.ParseRole(m.Role)
		if err != nil {
			return nil, err
		}
		members = append(members, project.ReconstituteMember(
			project.MemberID(m.ID),
			user.ID(m.UserID),
			role,
			m.CreatedAt,
			m.UpdatedAt,
		))
	}
	sections := make([]*project.Section, 0, len(secRows))
	for i := range secRows {
		s := &secRows[i]
		sections = append(sections, project.ReconstituteSection(
			project.SectionID(s.ID),
			s.Name,
			s.Position,
			s.CreatedAt,
			s.UpdatedAt,
		))
	}
	noteSections := make([]*project.NoteSection, 0, len(noteSecRows))
	for i := range noteSecRows {
		ns := &noteSecRows[i]
		noteSections = append(noteSections, project.ReconstituteNoteSection(
			project.NoteSectionID(ns.ID),
			ns.Name,
			ns.Position,
			ns.CreatedAt,
			ns.UpdatedAt,
		))
	}
	return project.Reconstitute(
		project.ID(pr.ID),
		pr.Name,
		pr.Description,
		kind,
		user.ID(pr.OwnerID),
		members,
		sections,
		noteSections,
		pr.CreatedAt,
		pr.UpdatedAt,
	), nil
}

func projectToRecord(p *project.Project) ProjectRecord {
	id := uint(0)
	if p.ID() != 0 {
		id = p.ID().Uint()
	}
	return ProjectRecord{
		ID:          id,
		Name:        p.Name(),
		Description: p.Description(),
		Kind:        p.Kind().String(),
		OwnerID:     p.OwnerID().Uint(),
		CreatedAt:   p.CreatedAt(),
		UpdatedAt:   p.UpdatedAt(),
	}
}

func memberToRecord(projectID project.ID, m *project.Member) MemberRecord {
	id := uint(0)
	if m.ID() != 0 {
		id = m.ID().Uint()
	}
	return MemberRecord{
		ID:        id,
		ProjectID: projectID.Uint(),
		UserID:    m.UserID().Uint(),
		Role:      m.Role().String(),
		CreatedAt: m.CreatedAt(),
		UpdatedAt: m.UpdatedAt(),
	}
}

func sectionToRecord(projectID project.ID, s *project.Section) SectionRecord {
	id := uint(0)
	if s.ID() != 0 {
		id = s.ID().Uint()
	}
	return SectionRecord{
		ID:        id,
		ProjectID: projectID.Uint(),
		Name:      s.Name(),
		Position:  s.Position(),
		CreatedAt: s.CreatedAt(),
		UpdatedAt: s.UpdatedAt(),
	}
}

func noteSectionToRecord(projectID project.ID, s *project.NoteSection) NoteSectionRecord {
	id := uint(0)
	if s.ID() != 0 {
		id = s.ID().Uint()
	}
	return NoteSectionRecord{
		ID:        id,
		ProjectID: projectID.Uint(),
		Name:      s.Name(),
		Position:  s.Position(),
		CreatedAt: s.CreatedAt(),
		UpdatedAt: s.UpdatedAt(),
	}
}
