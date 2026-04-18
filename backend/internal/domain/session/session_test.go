package session_test

import (
	"testing"
	"time"

	"task-manager/backend/internal/domain/session"
	"task-manager/backend/internal/domain/user"
)

func TestIssueDifferentTokens(t *testing.T) {
	now := time.Now()
	s1, p1, err := session.Issue(user.ID(1), time.Hour, now)
	if err != nil {
		t.Fatal(err)
	}
	s2, p2, err := session.Issue(user.ID(1), time.Hour, now)
	if err != nil {
		t.Fatal(err)
	}
	if p1 == p2 {
		t.Fatal("plain tokens should differ")
	}
	if s1.TokenHash() == s2.TokenHash() {
		t.Fatal("hashes should differ")
	}
}

func TestSessionIsActive(t *testing.T) {
	now := time.Date(2025, 1, 1, 12, 0, 0, 0, time.UTC)
	s, _, err := session.Issue(user.ID(1), time.Hour, now)
	if err != nil {
		t.Fatal(err)
	}
	if !s.IsActive(now.Add(30 * time.Minute)) {
		t.Fatal("should be active before expiry")
	}
	if s.IsActive(now.Add(2 * time.Hour)) {
		t.Fatal("should be inactive after expiry")
	}
	s.Revoke(now.Add(30 * time.Minute))
	if s.IsActive(now.Add(10 * time.Minute)) {
		t.Fatal("revoked should be inactive")
	}
}
