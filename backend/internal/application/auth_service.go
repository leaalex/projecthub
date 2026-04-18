package application

import (
	"context"
	"errors"
	"strings"
	"time"

	"task-manager/backend/internal/domain/session"
	"task-manager/backend/internal/domain/user"
	"task-manager/backend/internal/utils"
)

const minNewPasswordLen = 8

// AuthService — сценарии регистрации, входа, refresh, выхода и смены пароля.
type AuthService struct {
	Users         user.Repository
	Sessions      session.Repository
	JWTSecret     string
	AccessTTL     time.Duration
	RefreshTTL    time.Duration
	Clock         func() time.Time
}

func NewAuthService(users user.Repository, sess session.Repository, jwtSecret string, accessTTL, refreshTTL time.Duration) *AuthService {
	return &AuthService{
		Users:      users,
		Sessions:   sess,
		JWTSecret:  jwtSecret,
		AccessTTL:  accessTTL,
		RefreshTTL: refreshTTL,
		Clock:      time.Now,
	}
}

func (s *AuthService) signAccess(u *user.User) (string, error) {
	return utils.SignJWT(u.ID().Uint(), u.Role().String(), s.JWTSecret, s.AccessTTL)
}

func (s *AuthService) issueRefresh(ctx context.Context, uid user.ID) (plain string, err error) {
	now := s.Clock()
	sess, plain, err := session.Issue(uid, s.RefreshTTL, now)
	if err != nil {
		return "", err
	}
	if err := s.Sessions.Save(ctx, sess); err != nil {
		return "", err
	}
	return plain, nil
}

func (s *AuthService) Register(ctx context.Context, email, password, name string) (*user.User, string, string, error) {
	e, err := user.NewEmail(email)
	if err != nil {
		return nil, "", "", ErrInvalidInput
	}
	password = strings.TrimSpace(password)
	if password == "" {
		return nil, "", "", ErrInvalidInput
	}
	if _, err := s.Users.FindByEmail(ctx, e); err == nil {
		return nil, "", "", user.ErrEmailTaken
	} else if !errors.Is(err, user.ErrUserNotFound) {
		return nil, "", "", err
	}
	hash, err := user.HashPassword(password)
	if err != nil {
		return nil, "", "", err
	}
	fn := user.FullName{FirstName: strings.TrimSpace(name)}
	u, err := user.NewUser(e, hash, fn, user.RoleUser)
	if err != nil {
		return nil, "", "", err
	}
	now := s.Clock()
	u.Touch(now)
	if err := s.Users.Save(ctx, u); err != nil {
		return nil, "", "", err
	}
	access, err := s.signAccess(u)
	if err != nil {
		return nil, "", "", err
	}
	refresh, err := s.issueRefresh(ctx, u.ID())
	if err != nil {
		return nil, "", "", err
	}
	return u, access, refresh, nil
}

func (s *AuthService) Login(ctx context.Context, email, password string) (*user.User, string, string, error) {
	e, err := user.NewEmail(email)
	if err != nil {
		return nil, "", "", ErrInvalidInput
	}
	if strings.TrimSpace(password) == "" {
		return nil, "", "", ErrInvalidInput
	}
	u, err := s.Users.FindByEmail(ctx, e)
	if err != nil {
		if errors.Is(err, user.ErrUserNotFound) {
			return nil, "", "", ErrInvalidCreds
		}
		return nil, "", "", err
	}
	if err := u.PasswordHash().Matches(password); err != nil {
		return nil, "", "", ErrInvalidCreds
	}
	access, err := s.signAccess(u)
	if err != nil {
		return nil, "", "", err
	}
	refresh, err := s.issueRefresh(ctx, u.ID())
	if err != nil {
		return nil, "", "", err
	}
	return u, access, refresh, nil
}

func (s *AuthService) Refresh(ctx context.Context, refreshPlain string) (string, error) {
	refreshPlain = strings.TrimSpace(refreshPlain)
	if refreshPlain == "" {
		return "", ErrInvalidRefreshToken
	}
	h := session.HashToken(refreshPlain)
	sess, err := s.Sessions.FindByTokenHash(ctx, h)
	if err != nil {
		if errors.Is(err, session.ErrSessionNotFound) {
			return "", ErrInvalidRefreshToken
		}
		return "", err
	}
	now := s.Clock()
	if !sess.IsActive(now) {
		if sess.RevokedAt() != nil {
			return "", ErrInvalidRefreshToken
		}
		return "", ErrInvalidRefreshToken
	}
	u, err := s.Users.FindByID(ctx, sess.UserID())
	if err != nil {
		return "", ErrInvalidRefreshToken
	}
	return s.signAccess(u)
}

func (s *AuthService) Logout(ctx context.Context, refreshPlain string) error {
	refreshPlain = strings.TrimSpace(refreshPlain)
	if refreshPlain == "" {
		return nil
	}
	h := session.HashToken(refreshPlain)
	sess, err := s.Sessions.FindByTokenHash(ctx, h)
	if err != nil {
		if errors.Is(err, session.ErrSessionNotFound) {
			return nil
		}
		return err
	}
	sess.Revoke(s.Clock())
	return s.Sessions.Save(ctx, sess)
}

func (s *AuthService) Me(ctx context.Context, id user.ID) (*user.User, error) {
	return s.Users.FindByID(ctx, id)
}

func (s *AuthService) ChangePassword(ctx context.Context, id user.ID, currentPassword, newPassword string) error {
	newPassword = strings.TrimSpace(newPassword)
	if len(newPassword) < minNewPasswordLen {
		return ErrInvalidInput
	}
	u, err := s.Users.FindByID(ctx, id)
	if err != nil {
		return err
	}
	if err := u.PasswordHash().Matches(currentPassword); err != nil {
		return ErrInvalidCreds
	}
	hash, err := user.HashPassword(newPassword)
	if err != nil {
		return err
	}
	u.ChangePassword(hash)
	u.Touch(s.Clock())
	return s.Users.Save(ctx, u)
}
