package user_test

import (
	"testing"

	"task-manager/backend/internal/domain/user"
)

func TestNewEmail(t *testing.T) {
	e, err := user.NewEmail("  Alice@Example.COM  ")
	if err != nil {
		t.Fatal(err)
	}
	if e.String() != "alice@example.com" {
		t.Fatalf("got %q", e.String())
	}
}

func TestNewEmailEmpty(t *testing.T) {
	_, err := user.NewEmail("   ")
	if err != user.ErrInvalidEmail {
		t.Fatalf("want ErrInvalidEmail, got %v", err)
	}
}

func TestNewEmailInvalid(t *testing.T) {
	_, err := user.NewEmail("not-an-email")
	if err != user.ErrInvalidEmail {
		t.Fatalf("want ErrInvalidEmail, got %v", err)
	}
}
