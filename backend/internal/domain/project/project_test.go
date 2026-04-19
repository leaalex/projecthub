package project_test

import (
	"testing"
	"time"

	"task-manager/backend/internal/domain/project"
	"task-manager/backend/internal/domain/user"
)

func TestProject_AddMember_personal(t *testing.T) {
	owner := user.ID(1)
	p, err := project.NewProject(owner, user.RoleUser, "Solo", "", project.KindPersonal)
	if err != nil {
		t.Fatal(err)
	}
	now := time.Now()
	_, err = p.AddMember(user.ID(2), project.RoleViewer, now)
	if err != project.ErrPersonalNoMembers {
		t.Fatalf("got %v", err)
	}
}

func TestProject_AddMember_ownerForbidden(t *testing.T) {
	owner := user.ID(1)
	p, err := project.NewProject(owner, user.RoleCreator, "T", "", project.KindTeam)
	if err != nil {
		t.Fatal(err)
	}
	now := time.Now()
	_, err = p.AddMember(owner, project.RoleViewer, now)
	if err != project.ErrForbidden {
		t.Fatalf("got %v", err)
	}
}

func TestProject_AddMember_duplicate(t *testing.T) {
	owner := user.ID(1)
	p, err := project.NewProject(owner, user.RoleCreator, "T", "", project.KindTeam)
	if err != nil {
		t.Fatal(err)
	}
	now := time.Now()
	_, err = p.AddMember(user.ID(2), project.RoleViewer, now)
	if err != nil {
		t.Fatal(err)
	}
	_, err = p.AddMember(user.ID(2), project.RoleManager, now)
	if err != project.ErrAlreadyMember {
		t.Fatalf("got %v", err)
	}
}

func TestProject_RemoveMember_owner(t *testing.T) {
	owner := user.ID(1)
	p, err := project.NewProject(owner, user.RoleCreator, "T", "", project.KindTeam)
	if err != nil {
		t.Fatal(err)
	}
	if err := p.RemoveMember(owner, time.Now()); err != project.ErrCannotRemoveOwner {
		t.Fatalf("got %v", err)
	}
}

func TestProject_ReorderSections_invalid(t *testing.T) {
	owner := user.ID(1)
	p, err := project.NewProject(owner, user.RoleCreator, "T", "", project.KindTeam)
	if err != nil {
		t.Fatal(err)
	}
	now := time.Now()
	s1, _ := p.AddSection("A", now)
	s2, _ := p.AddSection("B", now)
	s1.AssignID(1)
	s2.AssignID(2)
	if err := p.ReorderSections([]project.SectionID{s1.ID()}, now); err != project.ErrInvalidReorder {
		t.Fatalf("incomplete: %v", err)
	}
	if err := p.ReorderSections([]project.SectionID{s1.ID(), s1.ID()}, now); err != project.ErrInvalidReorder {
		t.Fatalf("dup: %v", err)
	}
}

func TestNewProject_teamDeniedForEndUser(t *testing.T) {
	_, err := project.NewProject(user.ID(1), user.RoleUser, "X", "", project.KindTeam)
	if err != project.ErrTeamProjectNotAllowed {
		t.Fatalf("got %v", err)
	}
}

func TestProject_TransferOwnership(t *testing.T) {
	oldOwner := user.ID(1)
	newOwner := user.ID(2)
	p, err := project.NewProject(oldOwner, user.RoleCreator, "T", "", project.KindTeam)
	if err != nil {
		t.Fatal(err)
	}
	now := time.Now()
	_, _ = p.AddMember(newOwner, project.RoleViewer, now)
	if err := p.TransferOwnership(newOwner, now); err != nil {
		t.Fatal(err)
	}
	if p.OwnerID() != newOwner {
		t.Fatalf("owner %v", p.OwnerID())
	}
	m := p.Members()
	if len(m) != 1 || m[0].UserID() != oldOwner || m[0].Role() != project.RoleManager {
		t.Fatalf("members %+v", m)
	}
}
