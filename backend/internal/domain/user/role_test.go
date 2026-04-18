package user_test

import (
	"testing"

	"task-manager/backend/internal/domain/user"
)

func TestParseRoleMember(t *testing.T) {
	r, err := user.ParseRole("member")
	if err != nil || r != user.RoleUser {
		t.Fatalf("got %v %v", r, err)
	}
}

func TestParseRoleManager(t *testing.T) {
	r, err := user.ParseRole("manager")
	if err != nil || r != user.RoleCreator {
		t.Fatalf("got %v %v", r, err)
	}
}

func TestParseRoleEmpty(t *testing.T) {
	r, err := user.ParseRole("")
	if err != nil || r != user.RoleUser {
		t.Fatalf("got %v %v", r, err)
	}
}

func TestParseRoleInvalid(t *testing.T) {
	_, err := user.ParseRole("god")
	if err != user.ErrInvalidGlobalRole {
		t.Fatalf("got %v", err)
	}
}

func TestRoleIsSystem(t *testing.T) {
	if !user.RoleAdmin.IsSystem() {
		t.Fatal("admin")
	}
	if !user.RoleStaff.IsSystem() {
		t.Fatal("staff")
	}
	if user.RoleCreator.IsSystem() || user.RoleUser.IsSystem() {
		t.Fatal("creator/user should not be system")
	}
}
