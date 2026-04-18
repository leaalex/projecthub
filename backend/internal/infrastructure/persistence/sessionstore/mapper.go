package sessionstore

import (
	"task-manager/backend/internal/domain/session"
	"task-manager/backend/internal/domain/user"
)

func recordToDomain(r *Record) *session.Session {
	var h [32]byte
	copy(h[:], r.TokenHash)
	return session.Reconstitute(
		session.ID(r.ID),
		user.ID(r.UserID),
		h,
		r.ExpiresAt,
		r.CreatedAt,
		r.RevokedAt,
	)
}

func domainToRecord(s *session.Session) Record {
	h := s.TokenHash()
	return Record{
		ID:        s.ID().Uint(),
		UserID:    s.UserID().Uint(),
		TokenHash: h[:],
		ExpiresAt: s.ExpiresAt(),
		CreatedAt: s.CreatedAt(),
		RevokedAt: s.RevokedAt(),
	}
}
