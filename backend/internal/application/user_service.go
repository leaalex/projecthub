package application

import (
	"context"
	"errors"
	"strings"
	"time"

	"task-manager/backend/internal/domain/user"
)

const minAdminPasswordLen = 8

var allowedUserLocales = map[string]struct{}{
	"ru": {},
	"en": {},
}

// UserService — сценарии управления пользователями для /users.
type UserService struct {
	Users user.Repository
	Clock func() time.Time
}

func NewUserService(users user.Repository) *UserService {
	return &UserService{
		Users: users,
		Clock: time.Now,
	}
}

// UserProfilePatch — частичное обновление PUT /users/:id.
type UserProfilePatch struct {
	Name       *string
	Email      *string
	LastName   *string
	FirstName  *string
	Patronymic *string
	Department *string
	JobTitle   *string
	Phone      *string
	Locale     *string
	Password   *string
}

// AdminCreateInput — POST /users (только admin).
type AdminCreateInput struct {
	Email      string
	Password   string
	Role       user.Role
	LastName   string
	FirstName  string
	Patronymic string
	Department string
	JobTitle   string
	Phone      string
}

func (s *UserService) List(ctx context.Context) ([]*user.User, error) {
	return s.Users.List(ctx)
}

func (s *UserService) Get(ctx context.Context, id user.ID) (*user.User, error) {
	return s.Users.FindByID(ctx, id)
}

func (s *UserService) CanAccessUser(callerID user.ID, callerRole user.Role, targetID user.ID) bool {
	if callerID == targetID {
		return true
	}
	if callerRole.IsSystem() {
		return true
	}
	return false
}

func (s *UserService) AdminCreate(ctx context.Context, callerRole user.Role, in AdminCreateInput) (*user.User, error) {
	if callerRole != user.RoleAdmin {
		return nil, ErrForbidden
	}
	email, err := user.NewEmail(in.Email)
	if err != nil {
		return nil, ErrInvalidInput
	}
	password := strings.TrimSpace(in.Password)
	if password == "" {
		return nil, ErrInvalidInput
	}
	if len(password) < minAdminPasswordLen {
		return nil, ErrInvalidInput
	}
	role := in.Role
	if role == "" {
		role = user.RoleUser
	}
	switch role {
	case user.RoleUser, user.RoleCreator, user.RoleStaff:
	default:
		return nil, user.ErrInvalidGlobalRole
	}
	if existing, err := s.Users.FindByEmail(ctx, email); err == nil {
		_ = existing
		return nil, user.ErrEmailTaken
	} else if !errors.Is(err, user.ErrUserNotFound) {
		return nil, err
	}
	hash, err := user.HashPassword(password)
	if err != nil {
		return nil, err
	}
	fn := user.FullName{
		LastName:   strings.TrimSpace(in.LastName),
		FirstName:  strings.TrimSpace(in.FirstName),
		Patronymic: strings.TrimSpace(in.Patronymic),
	}
	u, err := user.NewUser(email, hash, fn, role)
	if err != nil {
		return nil, err
	}
	u.SetDepartment(in.Department)
	u.SetJobTitle(in.JobTitle)
	u.SetPhone(in.Phone)
	u.Touch(s.Clock())
	if err := s.Users.Save(ctx, u); err != nil {
		return nil, err
	}
	return s.Users.FindByID(ctx, u.ID())
}

func (s *UserService) Update(ctx context.Context, id, callerID user.ID, callerRole user.Role, patch UserProfilePatch) (*user.User, error) {
	if callerID != id && callerRole != user.RoleAdmin {
		return nil, ErrForbidden
	}
	u, err := s.Users.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if patch.Password != nil {
		p := strings.TrimSpace(*patch.Password)
		if p != "" {
			if callerRole != user.RoleAdmin {
				return nil, ErrForbidden
			}
			if len(p) < minAdminPasswordLen {
				return nil, ErrInvalidInput
			}
			hash, err := user.HashPassword(p)
			if err != nil {
				return nil, err
			}
			u.ChangePassword(hash)
		}
	}
	if patch.Email != nil {
		e, err := user.NewEmail(*patch.Email)
		if err != nil {
			return nil, ErrInvalidInput
		}
		existing, err := s.Users.FindByEmail(ctx, e)
		if err == nil {
			if existing.ID() != id {
				return nil, user.ErrEmailTaken
			}
		} else if !errors.Is(err, user.ErrUserNotFound) {
			return nil, err
		}
		u.ChangeEmail(e)
	}
	fn := u.Name()
	if patch.Name != nil {
		fn = fn.WithLegacy(*patch.Name)
	}
	if patch.LastName != nil {
		fn.LastName = strings.TrimSpace(*patch.LastName)
	}
	if patch.FirstName != nil {
		fn.FirstName = strings.TrimSpace(*patch.FirstName)
	}
	if patch.Patronymic != nil {
		fn.Patronymic = strings.TrimSpace(*patch.Patronymic)
	}
	if patch.Name != nil || patch.LastName != nil || patch.FirstName != nil || patch.Patronymic != nil {
		u.SetFullName(fn)
	}
	if patch.Department != nil {
		u.SetDepartment(*patch.Department)
	}
	if patch.JobTitle != nil {
		u.SetJobTitle(*patch.JobTitle)
	}
	if patch.Phone != nil {
		u.SetPhone(*patch.Phone)
	}
	if patch.Locale != nil {
		v := strings.ToLower(strings.TrimSpace(*patch.Locale))
		if _, ok := allowedUserLocales[v]; !ok {
			return nil, ErrInvalidInput
		}
		loc, err := user.NewLocale(v)
		if err != nil {
			return nil, ErrInvalidInput
		}
		u.ChangeLocale(loc)
	}
	u.Touch(s.Clock())
	if err := s.Users.Save(ctx, u); err != nil {
		return nil, err
	}
	return u, nil
}

func (s *UserService) Delete(ctx context.Context, id, adminID user.ID, adminRole user.Role) error {
	if adminRole != user.RoleAdmin {
		return ErrForbidden
	}
	if id == adminID {
		return user.ErrCannotDeleteSelf
	}
	if _, err := s.Users.FindByID(ctx, id); err != nil {
		return err
	}
	return s.Users.Delete(ctx, id)
}

func (s *UserService) SetGlobalRole(ctx context.Context, targetID, callerID user.ID, callerRole, newRole user.Role) (*user.User, error) {
	if callerRole != user.RoleAdmin {
		return nil, ErrForbidden
	}
	if targetID == callerID {
		return nil, user.ErrCannotChangeOwnRole
	}
	switch newRole {
	case user.RoleStaff, user.RoleCreator, user.RoleUser:
	default:
		return nil, user.ErrInvalidGlobalRole
	}
	u, err := s.Users.FindByID(ctx, targetID)
	if err != nil {
		return nil, err
	}
	if err := u.ChangeRole(newRole); err != nil {
		return nil, err
	}
	u.Touch(s.Clock())
	if err := s.Users.Save(ctx, u); err != nil {
		return nil, err
	}
	return u, nil
}
