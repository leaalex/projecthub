package notestore

import (
	"task-manager/backend/internal/domain/note"
	"task-manager/backend/internal/domain/project"
	"task-manager/backend/internal/domain/user"
)

func toDomain(r *NoteRecord) *note.Note {
	var secID *project.SectionID
	if r.SectionID != nil {
		s := project.SectionID(*r.SectionID)
		secID = &s
	}
	return note.Reconstitute(
		note.ID(r.ID),
		project.ID(r.ProjectID),
		secID,
		user.ID(r.AuthorID),
		r.Title,
		r.Body,
		r.Position,
		r.CreatedAt,
		r.UpdatedAt,
	)
}

func fromDomain(n *note.Note) NoteRecord {
	var sec *uint
	if sid := n.SectionID(); sid != nil {
		v := sid.Uint()
		sec = &v
	}
	return NoteRecord{
		ID:        n.ID().Uint(),
		ProjectID: n.ProjectID().Uint(),
		SectionID: sec,
		AuthorID:  n.AuthorID().Uint(),
		Title:     n.Title(),
		Body:      n.Body(),
		Position:  n.Position(),
		CreatedAt: n.CreatedAt(),
		UpdatedAt: n.UpdatedAt(),
	}
}
