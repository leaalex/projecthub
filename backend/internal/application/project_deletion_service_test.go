package application_test

import (
	"context"
	"errors"
	"testing"
	"time"

	"task-manager/backend/internal/application"
	"task-manager/backend/internal/domain/project"
	"task-manager/backend/internal/domain/user"
)

func TestProjectDeletionService_SoftDeleteAndRestore(t *testing.T) {
	memP := newMemProjects()
	memT := newMemTasks()
	svc := application.NewProjectDeletionService(memP, memT, nil)

	p, err := project.NewProject(user.ID(1), user.RoleCreator, "Arc", "", project.KindTeam)
	if err != nil {
		t.Fatal(err)
	}
	p.Touch(time.Now())
	if err := memP.Save(context.Background(), p); err != nil {
		t.Fatal(err)
	}
	pid := p.ID().Uint()

	if err := svc.SoftDelete(context.Background(), pid, 1, user.RoleCreator); err != nil {
		t.Fatal(err)
	}
	if _, err := memP.FindByID(context.Background(), project.ID(pid)); !errors.Is(err, project.ErrProjectNotFound) {
		t.Fatalf("expected soft-deleted project hidden, got %v", err)
	}

	if err := svc.Restore(context.Background(), pid, 1, user.RoleCreator); err != nil {
		t.Fatal(err)
	}
	if _, err := memP.FindByID(context.Background(), project.ID(pid)); err != nil {
		t.Fatalf("expected project visible after restore: %v", err)
	}
}
