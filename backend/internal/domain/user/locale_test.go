package user_test

import (
	"testing"

	"task-manager/backend/internal/domain/user"
)

func TestNewLocaleRu(t *testing.T) {
	l, err := user.NewLocale(" RU ")
	if err != nil || l.String() != "ru" {
		t.Fatalf("got %v %v", l, err)
	}
}

func TestNewLocaleInvalid(t *testing.T) {
	_, err := user.NewLocale("de")
	if err != user.ErrInvalidLocale {
		t.Fatalf("got %v", err)
	}
}
