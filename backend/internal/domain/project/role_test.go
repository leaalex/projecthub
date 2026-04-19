package project_test

import (
	"testing"

	"task-manager/backend/internal/domain/project"
)

func TestParseRole(t *testing.T) {
	for _, s := range []string{"manager", "executor", "viewer"} {
		r, err := project.ParseRole(s)
		if err != nil || !r.IsValid() {
			t.Fatalf("%s: %v %v", s, r, err)
		}
	}
	_, err := project.ParseRole("boss")
	if err == nil {
		t.Fatal("expected error")
	}
}
