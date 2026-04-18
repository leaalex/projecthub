package application_test

import (
	"context"
	"errors"
	"sync"
	"testing"
	"time"

	"task-manager/backend/internal/application"
	"task-manager/backend/internal/domain/session"
	"task-manager/backend/internal/domain/user"
)

type memUsers struct {
	mu      sync.Mutex
	byID    map[uint]*user.User
	byEmail map[string]*user.User
}

func newMemUsers() *memUsers {
	return &memUsers{
		byID:    map[uint]*user.User{},
		byEmail: map[string]*user.User{},
	}
}

func (m *memUsers) FindByID(ctx context.Context, id user.ID) (*user.User, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	u, ok := m.byID[id.Uint()]
	if !ok {
		return nil, user.ErrUserNotFound
	}
	return u, nil
}

func (m *memUsers) FindByEmail(ctx context.Context, e user.Email) (*user.User, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	u, ok := m.byEmail[e.String()]
	if !ok {
		return nil, user.ErrUserNotFound
	}
	return u, nil
}

func (m *memUsers) List(ctx context.Context) ([]*user.User, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	out := make([]*user.User, 0, len(m.byID))
	for _, u := range m.byID {
		out = append(out, u)
	}
	return out, nil
}

func (m *memUsers) Save(ctx context.Context, u *user.User) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	if u.ID().Uint() == 0 {
		id := uint(len(m.byID) + 1)
		u.AssignID(user.ID(id))
	}
	if _, exists := m.byEmail[u.Email().String()]; exists {
		other := m.byEmail[u.Email().String()]
		if other.ID().Uint() != u.ID().Uint() {
			return user.ErrEmailTaken
		}
	}
	cp := *u
	m.byID[u.ID().Uint()] = &cp
	m.byEmail[u.Email().String()] = m.byID[u.ID().Uint()]
	return nil
}

func (m *memUsers) Delete(ctx context.Context, id user.ID) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	u, ok := m.byID[id.Uint()]
	if !ok {
		return user.ErrUserNotFound
	}
	delete(m.byEmail, u.Email().String())
	delete(m.byID, id.Uint())
	return nil
}

type memSessions struct {
	mu      sync.Mutex
	rows    map[[32]byte]*session.Session
	nextSID uint
}

func newMemSessions() *memSessions {
	return &memSessions{rows: map[[32]byte]*session.Session{}}
}

func (m *memSessions) Save(ctx context.Context, s *session.Session) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	if s.ID().Uint() == 0 {
		m.nextSID++
		s.AssignID(session.ID(m.nextSID))
	}
	cp := *s
	m.rows[cp.TokenHash()] = &cp
	return nil
}

func (m *memSessions) FindByTokenHash(ctx context.Context, hash [32]byte) (*session.Session, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	s, ok := m.rows[hash]
	if !ok {
		return nil, session.ErrSessionNotFound
	}
	return s, nil
}

func (m *memSessions) RevokeAllByUser(ctx context.Context, uid user.ID) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	now := time.Now()
	for _, s := range m.rows {
		if s.UserID() == uid {
			s.Revoke(now)
		}
	}
	return nil
}

func TestAuthService_RegisterLoginRefreshLogout(t *testing.T) {
	users := newMemUsers()
	sess := newMemSessions()
	clock := time.Date(2025, 6, 1, 12, 0, 0, 0, time.UTC)
	svc := application.NewAuthService(users, sess, "secret", time.Hour, 24*time.Hour)
	svc.Clock = func() time.Time { return clock }

	ctx := context.Background()
	u, access, refresh, err := svc.Register(ctx, "a@b.co", "password123", "Ann")
	if err != nil {
		t.Fatal(err)
	}
	if access == "" || refresh == "" || u == nil {
		t.Fatal("expected tokens and user")
	}

	_, access2, _, err := svc.Login(ctx, "a@b.co", "password123")
	if err != nil || access2 == "" {
		t.Fatal(err)
	}

	access3, err := svc.Refresh(ctx, refresh)
	if err != nil || access3 == "" {
		t.Fatalf("refresh: %v", err)
	}

	if err := svc.Logout(ctx, refresh); err != nil {
		t.Fatal(err)
	}
	if _, err := svc.Refresh(ctx, refresh); !errors.Is(err, application.ErrInvalidRefreshToken) {
		t.Fatalf("expected ErrInvalidRefreshToken after logout, got %v", err)
	}
}

func TestAuthService_RegisterDuplicateEmail(t *testing.T) {
	users := newMemUsers()
	sess := newMemSessions()
	svc := application.NewAuthService(users, sess, "secret", time.Hour, time.Hour)
	ctx := context.Background()
	_, _, _, err := svc.Register(ctx, "dup@x.co", "password123", "A")
	if err != nil {
		t.Fatal(err)
	}
	_, _, _, err = svc.Register(ctx, "dup@x.co", "password999", "B")
	if !errors.Is(err, user.ErrEmailTaken) {
		t.Fatalf("got %v", err)
	}
}

func TestAuthService_ChangePassword_RevokesSessions(t *testing.T) {
	users := newMemUsers()
	sess := newMemSessions()
	clock := time.Date(2025, 6, 1, 12, 0, 0, 0, time.UTC)
	svc := application.NewAuthService(users, sess, "secret", time.Hour, 24*time.Hour)
	svc.Clock = func() time.Time { return clock }

	ctx := context.Background()
	u, _, refresh, err := svc.Register(ctx, "cp@x.co", "password123", "Bob")
	if err != nil {
		t.Fatal(err)
	}
	if err := svc.ChangePassword(ctx, u.ID(), "password123", "newpassword9"); err != nil {
		t.Fatal(err)
	}
	if _, err := svc.Refresh(ctx, refresh); !errors.Is(err, application.ErrInvalidRefreshToken) {
		t.Fatalf("expected ErrInvalidRefreshToken after password change, got %v", err)
	}
	_, access, _, err := svc.Login(ctx, "cp@x.co", "newpassword9")
	if err != nil || access == "" {
		t.Fatalf("login with new password: %v", err)
	}
}
