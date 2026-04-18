package user_test

import (
	"testing"
	"time"

	"task-manager/backend/internal/domain/user"
)

func mustEmail(t *testing.T, s string) user.Email {
	t.Helper()
	e, err := user.NewEmail(s)
	if err != nil {
		t.Fatal(err)
	}
	return e
}

func mustHash(t *testing.T, plain string) user.PasswordHash {
	t.Helper()
	h, err := user.HashPassword(plain)
	if err != nil {
		t.Fatal(err)
	}
	return h
}

func TestNewUserInvalidRole(t *testing.T) {
	_, err := user.NewUser(mustEmail(t, "a@b.co"), mustHash(t, "password123"), user.FullName{}, user.Role("invalid"))
	if err != user.ErrInvalidGlobalRole {
		t.Fatalf("got %v", err)
	}
}

func TestUserChangeRoleInvalid(t *testing.T) {
	u, err := user.NewUser(mustEmail(t, "a@b.co"), mustHash(t, "password123"), user.FullName{}, user.RoleUser)
	if err != nil {
		t.Fatal(err)
	}
	if err := u.ChangeRole(user.Role("bad")); err != user.ErrInvalidGlobalRole {
		t.Fatalf("got %v", err)
	}
}

func TestUserChangeRoleOk(t *testing.T) {
	u, err := user.NewUser(mustEmail(t, "a@b.co"), mustHash(t, "password123"), user.FullName{}, user.RoleUser)
	if err != nil {
		t.Fatal(err)
	}
	if err := u.ChangeRole(user.RoleStaff); err != nil {
		t.Fatal(err)
	}
	if u.Role() != user.RoleStaff {
		t.Fatal("role not updated")
	}
}

func TestUserTouch(t *testing.T) {
	u, _ := user.NewUser(mustEmail(t, "a@b.co"), mustHash(t, "password123"), user.FullName{}, user.RoleUser)
	now := time.Date(2025, 1, 2, 3, 4, 5, 0, time.UTC)
	u.Touch(now)
	if u.CreatedAt() != now || u.UpdatedAt() != now {
		t.Fatalf("times %v %v", u.CreatedAt(), u.UpdatedAt())
	}
	u.Touch(now.Add(time.Hour))
	if u.CreatedAt() != now {
		t.Fatal("createdAt should not change")
	}
}
