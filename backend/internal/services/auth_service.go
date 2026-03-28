package services

import (
	"errors"
	"strings"

	"task-manager/backend/internal/models"
	"task-manager/backend/internal/utils"

	"gorm.io/gorm"
)

var (
	ErrEmailTaken      = errors.New("email already registered")
	ErrInvalidCreds    = errors.New("invalid email or password")
	ErrInvalidInput    = errors.New("invalid input")
)

type AuthService struct {
	DB            *gorm.DB
	JWTSecret     string
	JWTExpiryHrs  int
}

func (s *AuthService) Register(email, password, name string) (*models.User, string, error) {
	email = strings.TrimSpace(strings.ToLower(email))
	name = strings.TrimSpace(name)
	if email == "" || password == "" {
		return nil, "", ErrInvalidInput
	}

	var existing models.User
	if err := s.DB.Where("email = ?", email).First(&existing).Error; err == nil {
		return nil, "", ErrEmailTaken
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, "", err
	}

	hash, err := utils.HashPassword(password)
	if err != nil {
		return nil, "", err
	}

	u := models.User{
		Email:        email,
		PasswordHash: hash,
		FirstName:    name,
		Role:         models.RoleMember,
	}
	models.SyncNameFromFIO(&u)
	if err := s.DB.Create(&u).Error; err != nil {
		return nil, "", err
	}

	token, err := utils.SignJWT(u.ID, string(u.Role), s.JWTSecret, s.JWTExpiryHrs)
	if err != nil {
		return nil, "", err
	}
	return &u, token, nil
}

func (s *AuthService) Login(email, password string) (*models.User, string, error) {
	email = strings.TrimSpace(strings.ToLower(email))
	if email == "" || password == "" {
		return nil, "", ErrInvalidInput
	}

	var u models.User
	if err := s.DB.Where("email = ?", email).First(&u).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, "", ErrInvalidCreds
		}
		return nil, "", err
	}

	if err := utils.CheckPassword(u.PasswordHash, password); err != nil {
		return nil, "", ErrInvalidCreds
	}

	token, err := utils.SignJWT(u.ID, string(u.Role), s.JWTSecret, s.JWTExpiryHrs)
	if err != nil {
		return nil, "", err
	}
	return &u, token, nil
}

func (s *AuthService) UserByID(id uint) (*models.User, error) {
	var u models.User
	if err := s.DB.First(&u, id).Error; err != nil {
		return nil, err
	}
	return &u, nil
}

const minNewPasswordLen = 8

func (s *AuthService) ChangePassword(userID uint, currentPassword, newPassword string) error {
	newPassword = strings.TrimSpace(newPassword)
	if len(newPassword) < minNewPasswordLen {
		return ErrInvalidInput
	}
	var u models.User
	if err := s.DB.First(&u, userID).Error; err != nil {
		return err
	}
	if err := utils.CheckPassword(u.PasswordHash, currentPassword); err != nil {
		return ErrInvalidCreds
	}
	hash, err := utils.HashPassword(newPassword)
	if err != nil {
		return err
	}
	u.PasswordHash = hash
	return s.DB.Save(&u).Error
}
