package services

import (
	"errors"
	"strings"

	"task-manager/backend/internal/models"
	"task-manager/backend/internal/utils"

	"gorm.io/gorm"
)

var ErrUserNotFound = errors.New("user not found")
var ErrCannotDeleteSelf = errors.New("cannot delete own account")
var ErrCannotChangeOwnRole = errors.New("cannot change own global role")
var ErrInvalidGlobalRole = errors.New("invalid global role")

type UserService struct {
	DB *gorm.DB
}

const minAdminPasswordLen = 8

var allowedUserLocales = map[string]struct{}{
	"ru": {},
	"en": {},
}

// UserProfilePatch — частичное обновление для PUT /users/:id.
type UserProfilePatch struct {
	Name        *string
	Email       *string
	LastName    *string
	FirstName   *string
	Patronymic  *string
	Department  *string
	JobTitle    *string
	Phone       *string
	Locale      *string
	// Password: применяется только если вызывающий — admin; пустая строка игнорируется.
	Password *string
}

// AdminCreateInput используется POST /users (только admin).
type AdminCreateInput struct {
	Email      string
	Password   string
	Role       models.Role
	LastName   string
	FirstName  string
	Patronymic string
	Department string
	JobTitle   string
	Phone      string
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
	if callerRole == models.RoleAdmin || callerRole == models.RoleStaff {
		return true
	}
	return false
}

func (s *UserService) AdminCreate(callerRole models.Role, in AdminCreateInput) (*models.User, error) {
	if callerRole != models.RoleAdmin {
		return nil, ErrForbidden
	}
	email := strings.TrimSpace(strings.ToLower(in.Email))
	password := strings.TrimSpace(in.Password)
	if email == "" || password == "" {
		return nil, ErrInvalidInput
	}
	if len(password) < minAdminPasswordLen {
		return nil, ErrInvalidInput
	}
	role := in.Role
	if role == "" {
		role = models.RoleUser
	}
	switch role {
	case models.RoleUser, models.RoleCreator, models.RoleStaff:
	default:
		return nil, ErrInvalidGlobalRole
	}
	var existing models.User
	if err := s.DB.Where("email = ?", email).First(&existing).Error; err == nil {
		return nil, ErrEmailTaken
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}
	hash, err := utils.HashPassword(password)
	if err != nil {
		return nil, err
	}
	u := models.User{
		Email:        email,
		PasswordHash: hash,
		Role:         role,
		LastName:     strings.TrimSpace(in.LastName),
		FirstName:    strings.TrimSpace(in.FirstName),
		Patronymic:   strings.TrimSpace(in.Patronymic),
		Department:   strings.TrimSpace(in.Department),
		JobTitle:     strings.TrimSpace(in.JobTitle),
		Phone:        strings.TrimSpace(in.Phone),
	}
	models.SyncNameFromFIO(&u)
	if err := s.DB.Create(&u).Error; err != nil {
		return nil, err
	}
	return s.Get(u.ID)
}

func (s *UserService) Update(id, callerID uint, callerRole models.Role, patch UserProfilePatch) (*models.User, error) {
	if callerID != id && callerRole != models.RoleAdmin {
		return nil, ErrForbidden
	}
	u, err := s.Get(id)
	if err != nil {
		return nil, err
	}
	if patch.Password != nil {
		p := strings.TrimSpace(*patch.Password)
		if p != "" {
			if callerRole != models.RoleAdmin {
				return nil, ErrForbidden
			}
			if len(p) < minAdminPasswordLen {
				return nil, ErrInvalidInput
			}
			hash, err := utils.HashPassword(p)
			if err != nil {
				return nil, err
			}
			u.PasswordHash = hash
		}
	}
	if patch.Email != nil {
		e := strings.TrimSpace(strings.ToLower(*patch.Email))
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
	if patch.Name != nil {
		u.Name = strings.TrimSpace(*patch.Name)
	}
	if patch.LastName != nil {
		u.LastName = strings.TrimSpace(*patch.LastName)
	}
	if patch.FirstName != nil {
		u.FirstName = strings.TrimSpace(*patch.FirstName)
	}
	if patch.Patronymic != nil {
		u.Patronymic = strings.TrimSpace(*patch.Patronymic)
	}
	if patch.Department != nil {
		u.Department = strings.TrimSpace(*patch.Department)
	}
	if patch.JobTitle != nil {
		u.JobTitle = strings.TrimSpace(*patch.JobTitle)
	}
	if patch.Phone != nil {
		u.Phone = strings.TrimSpace(*patch.Phone)
	}
	if patch.Locale != nil {
		v := strings.ToLower(strings.TrimSpace(*patch.Locale))
		if _, ok := allowedUserLocales[v]; !ok {
			return nil, ErrInvalidInput
		}
		u.Locale = v
	}
	models.SyncNameFromFIO(u)
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

// SetGlobalRole назначает роль staff, creator или user. Только admin; не может менять роль самому себе; не может назначать admin.
func (s *UserService) SetGlobalRole(targetID, callerID uint, callerRole models.Role, newRole models.Role) (*models.User, error) {
	if callerRole != models.RoleAdmin {
		return nil, ErrForbidden
	}
	if targetID == callerID {
		return nil, ErrCannotChangeOwnRole
	}
	switch newRole {
	case models.RoleStaff, models.RoleCreator, models.RoleUser:
	default:
		return nil, ErrInvalidGlobalRole
	}
	u, err := s.Get(targetID)
	if err != nil {
		return nil, err
	}
	u.Role = newRole
	if err := s.DB.Save(u).Error; err != nil {
		return nil, err
	}
	return u, nil
}
