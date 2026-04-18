package session

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"io"
	"time"

	"task-manager/backend/internal/domain/user"
)

// Session — refresh-сессия: в БД хранится только SHA-256 от opaque-токена.
type Session struct {
	id        ID
	userID    user.ID
	tokenHash [32]byte
	expiresAt time.Time
	createdAt time.Time
	revokedAt *time.Time
}

// HashToken вычисляет SHA-256 от строки токена (как при сохранении в Issue).
func HashToken(plain string) [32]byte {
	return sha256.Sum256([]byte(plain))
}

// Issue создаёт новую сессию; plain — значение для HttpOnly-cookie.
func Issue(userID user.ID, ttl time.Duration, now time.Time) (*Session, string, error) {
	var b [32]byte
	if _, err := io.ReadFull(rand.Reader, b[:]); err != nil {
		return nil, "", err
	}
	plain := base64.RawURLEncoding.EncodeToString(b[:])
	h := HashToken(plain)
	return &Session{
		userID:    userID,
		tokenHash: h,
		expiresAt: now.Add(ttl),
		createdAt: now,
	}, plain, nil
}

// Reconstitute восстанавливает сессию из БД.
func Reconstitute(id ID, userID user.ID, tokenHash [32]byte, expiresAt, createdAt time.Time, revokedAt *time.Time) *Session {
	return &Session{
		id:        id,
		userID:    userID,
		tokenHash: tokenHash,
		expiresAt: expiresAt,
		createdAt: createdAt,
		revokedAt: revokedAt,
	}
}

func (s *Session) AssignID(id ID) {
	s.id = id
}

func (s *Session) ID() ID                 { return s.id }
func (s *Session) UserID() user.ID       { return s.userID }
func (s *Session) TokenHash() [32]byte   { return s.tokenHash }
func (s *Session) ExpiresAt() time.Time  { return s.expiresAt }
func (s *Session) CreatedAt() time.Time  { return s.createdAt }
func (s *Session) RevokedAt() *time.Time { return s.revokedAt }

func (s *Session) Revoke(now time.Time) {
	if s.revokedAt != nil {
		return
	}
	t := now
	s.revokedAt = &t
}

func (s *Session) IsActive(now time.Time) bool {
	if s.revokedAt != nil {
		return false
	}
	return now.Before(s.expiresAt)
}
