package services

import (
	"errors"
	"strings"

	"task-manager/backend/internal/models"

	"gorm.io/gorm"
)

var ErrUserNotFound = errors.New("user not found")
var ErrCannotDeleteSelf = errors.New("cannot delete own account")

type UserService struct {
	DB *gorm.DB
}

func (s *UserService) List() ([]models.User, error) {
	var users []models.User
	err := s.DB.Order("id asc").Find(&users).Error
	return users, err
}

func (s *UserService) Get(id uint) (*models.User, error) {
	var u models.User
	if err := s.DB.First(&u, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}
	return &u, nil
}

func (s *UserService) CanAccessUser(callerID uint, callerRole models.Role, targetID uint) bool {
	if callerID == targetID {
		return true
	}
	return callerRole == models.RoleAdmin
}

func (s *UserService) Update(id, callerID uint, callerRole models.Role, name, email *string) (*models.User, error) {
	if !s.CanAccessUser(callerID, callerRole, id) {
		return nil, ErrForbidden
	}
	u, err := s.Get(id)
	if err != nil {
		return nil, err
	}
	if email != nil {
		e := strings.TrimSpace(strings.ToLower(*email))
		if e == "" {
			return nil, ErrInvalidInput
		}
		var other models.User
		err := s.DB.Where("email = ? AND id <> ?", e, id).First(&other).Error
		if err == nil {
			return nil, ErrEmailTaken
		}
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, err
		}
		u.Email = e
	}
	if name != nil {
		u.Name = strings.TrimSpace(*name)
	}
	if err := s.DB.Save(u).Error; err != nil {
		return nil, err
	}
	return u, nil
}

func (s *UserService) Delete(id, adminID uint, adminRole models.Role) error {
	if adminRole != models.RoleAdmin {
		return ErrForbidden
	}
	if id == adminID {
		return ErrCannotDeleteSelf
	}
	u, err := s.Get(id)
	if err != nil {
		return err
	}
	return s.DB.Delete(u).Error
}
