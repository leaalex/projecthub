package project_test

import (
	"testing"

	"task-manager/backend/internal/domain/project"
)

func TestParseKind(t *testing.T) {
	k, err := project.ParseKind("personal")
	if err != nil || k != project.KindPersonal {
		t.Fatalf("personal: %v %v", k, err)
	}
	k, err = project.ParseKind("team")
	if err != nil || k != project.KindTeam {
		t.Fatalf("team: %v %v", k, err)
	}
	_, err = project.ParseKind("nope")
	if err == nil {
		t.Fatal("expected error")
	}
}
