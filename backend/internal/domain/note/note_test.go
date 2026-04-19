package note_test

import (
	"testing"
	"time"

	"task-manager/backend/internal/domain/note"
	"task-manager/backend/internal/domain/project"
	"task-manager/backend/internal/domain/user"
)

func TestNewNote_requiresTitle(t *testing.T) {
	_, err := note.NewNote(project.ID(1), nil, user.ID(1), "  ", "", 0, time.Now())
	if err != note.ErrTitleRequired {
		t.Fatalf("expected ErrTitleRequired, got %v", err)
	}
}

func TestNewNote_successfulCreation(t *testing.T) {
	now := time.Now()
	n, err := note.NewNote(project.ID(1), nil, user.ID(1), " My note ", "body text", 0, now)
	if err != nil {
		t.Fatal(err)
	}
	if n.Title() != "My note" {
		t.Errorf("expected trimmed title, got %q", n.Title())
	}
	if n.Body() != "body text" {
		t.Errorf("unexpected body: %q", n.Body())
	}
	if n.ProjectID() != project.ID(1) {
		t.Errorf("unexpected project: %v", n.ProjectID())
	}
}

func TestNote_Rename(t *testing.T) {
	now := time.Now()
	n, _ := note.NewNote(project.ID(1), nil, user.ID(1), "Old", "", 0, now)
	if err := n.Rename("New Title", now.Add(time.Second)); err != nil {
		t.Fatal(err)
	}
	if n.Title() != "New Title" {
		t.Errorf("expected 'New Title', got %q", n.Title())
	}
}

func TestNote_Rename_empty(t *testing.T) {
	now := time.Now()
	n, _ := note.NewNote(project.ID(1), nil, user.ID(1), "Old", "", 0, now)
	if err := n.Rename("", now); err != note.ErrTitleRequired {
		t.Fatalf("expected ErrTitleRequired, got %v", err)
	}
}

func TestNote_SetBody(t *testing.T) {
	now := time.Now()
	n, _ := note.NewNote(project.ID(1), nil, user.ID(1), "T", "", 0, now)
	n.SetBody("# Hello\n\nMarkdown body", now.Add(time.Second))
	if n.Body() != "# Hello\n\nMarkdown body" {
		t.Errorf("unexpected body: %q", n.Body())
	}
}

func TestNote_MoveToSection(t *testing.T) {
	now := time.Now()
	n, _ := note.NewNote(project.ID(1), nil, user.ID(1), "T", "", 0, now)
	sid := project.NoteSectionID(42)
	n.MoveToSection(&sid, 5, now.Add(time.Second))
	if n.SectionID() == nil || *n.SectionID() != sid {
		t.Errorf("expected section 42, got %v", n.SectionID())
	}
	if n.Position() != 5 {
		t.Errorf("expected position 5, got %d", n.Position())
	}
}

func TestNote_Reconstitute(t *testing.T) {
	now := time.Now()
	sid := project.NoteSectionID(7)
	n := note.Reconstitute(
		note.ID(99), project.ID(3), &sid, user.ID(5),
		"Restored note", "body", 2, now, now,
	)
	if n.ID() != note.ID(99) {
		t.Errorf("unexpected id: %v", n.ID())
	}
	if n.AuthorID() != user.ID(5) {
		t.Errorf("unexpected author: %v", n.AuthorID())
	}
}
