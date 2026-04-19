package project

import (
	"time"

	"task-manager/backend/internal/domain/user"
)

// Member — участник проекта (владелец в таблице не хранится).
type Member struct {
	id        MemberID
	userID    user.ID
	role      Role
	createdAt time.Time
	updatedAt time.Time
}

func ReconstituteMember(id MemberID, uid user.ID, role Role, createdAt, updatedAt time.Time) *Member {
	return &Member{
		id:        id,
		userID:    uid,
		role:      role,
		createdAt: createdAt,
		updatedAt: updatedAt,
	}
}

func newMember(uid user.ID, role Role, now time.Time) *Member {
	return &Member{
		userID:    uid,
		role:      role,
		createdAt: now,
		updatedAt: now,
	}
}

func (m *Member) ID() MemberID         { return m.id }
func (m *Member) UserID() user.ID      { return m.userID }
func (m *Member) Role() Role           { return m.role }
func (m *Member) CreatedAt() time.Time { return m.createdAt }
func (m *Member) UpdatedAt() time.Time { return m.updatedAt }

func (m *Member) AssignID(id MemberID) { m.id = id }

func (m *Member) ChangeRole(r Role, now time.Time) error {
	if !r.IsValid() {
		return ErrInvalidMemberRole
	}
	m.role = r
	m.updatedAt = now
	return nil
}
