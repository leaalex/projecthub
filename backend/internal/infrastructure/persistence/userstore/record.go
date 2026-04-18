package userstore

import "time"

// Record — строка таблицы users (GORM). Экспортируется для AutoMigrate в database.Open.
type Record struct {
	ID           uint      `gorm:"primaryKey"`
	Email        string    `gorm:"uniqueIndex;not null"`
	PasswordHash string    `gorm:"not null"`
	Name         string
	LastName     string
	FirstName    string
	Patronymic   string
	Department   string
	JobTitle     string
	Phone        string
	Locale       string `gorm:"size:8;default:'ru'"`
	Role         string `gorm:"default:'user'"`
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

func (Record) TableName() string {
	return "users"
}
