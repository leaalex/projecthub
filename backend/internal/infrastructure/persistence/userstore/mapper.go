package userstore

import (
	"fmt"

	"task-manager/backend/internal/domain/user"
)

func recordToDomain(r *Record) (*user.User, error) {
	email, err := user.NewEmail(r.Email)
	if err != nil {
		return nil, fmt.Errorf("userstore: bad email in db: %w", err)
	}
	loc, err := user.NewLocale(r.Locale)
	if err != nil {
		loc = user.DefaultLocale()
	}
	role, err := user.ParseRole(r.Role)
	if err != nil {
		return nil, fmt.Errorf("userstore: bad role in db: %w", err)
	}
	fn := user.FullName{
		LastName:   r.LastName,
		FirstName:  r.FirstName,
		Patronymic: r.Patronymic,
		Legacy:     r.Name,
	}
	return user.Reconstitute(
		user.ID(r.ID),
		email,
		fn,
		role,
		loc,
		user.PasswordHashFromStored(r.PasswordHash),
		r.Department,
		r.JobTitle,
		r.Phone,
		r.CreatedAt,
		r.UpdatedAt,
	), nil
}

func domainToRecord(u *user.User) Record {
	fn := u.Name()
	return Record{
		ID:           u.ID().Uint(),
		Email:        u.Email().String(),
		PasswordHash: u.PasswordHash().String(),
		Name:         fn.Legacy,
		LastName:     fn.LastName,
		FirstName:    fn.FirstName,
		Patronymic:   fn.Patronymic,
		Department:   u.Department(),
		JobTitle:     u.JobTitle(),
		Phone:        u.Phone(),
		Locale:       u.Locale().String(),
		Role:         u.Role().String(),
		CreatedAt:    u.CreatedAt(),
		UpdatedAt:    u.UpdatedAt(),
	}
}
