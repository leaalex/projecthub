package sessionstore

import "time"

// Record — строка таблицы user_sessions.
type Record struct {
	ID        uint `gorm:"primaryKey"`
	UserID    uint `gorm:"not null;index"`
	TokenHash []byte `gorm:"type:blob;size:32;uniqueIndex;not null"`
	ExpiresAt time.Time
	CreatedAt time.Time
	RevokedAt *time.Time
}

func (Record) TableName() string {
	return "user_sessions"
}
