package user_test

import (
	"testing"

	"task-manager/backend/internal/domain/user"
)

func TestFullNameDisplayNameFIO(t *testing.T) {
	n := user.FullName{LastName: "Иванов", FirstName: "Иван", Patronymic: "Иванович"}
	if n.DisplayName() != "Иванов Иван Иванович" {
		t.Fatalf("got %q", n.DisplayName())
	}
}

func TestFullNameDisplayNameLegacy(t *testing.T) {
	n := user.FullName{Legacy: "Legacy Name"}
	if n.DisplayName() != "Legacy Name" {
		t.Fatalf("got %q", n.DisplayName())
	}
}

func TestFullNameWithLegacy(t *testing.T) {
	n := user.FullName{LastName: "Петров"}
	n2 := n.WithLegacy("ignored until FIO empty")
	if n2.DisplayName() != "Петров" {
		t.Fatalf("got %q", n2.DisplayName())
	}
}

func TestFullNameSyncLegacyName(t *testing.T) {
	n := user.FullName{FirstName: "Alice"}
	n.SyncLegacyName()
	if n.Legacy != "Alice" {
		t.Fatalf("Legacy want Alice, got %q", n.Legacy)
	}
}
