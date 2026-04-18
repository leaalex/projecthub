package user

import "context"

// Repository — доступ к персистентному хранилищу пользователей.
type Repository interface {
	FindByID(ctx context.Context, id ID) (*User, error)
	FindByEmail(ctx context.Context, e Email) (*User, error)
	List(ctx context.Context) ([]*User, error)
	Save(ctx context.Context, u *User) error
	Delete(ctx context.Context, id ID) error
}
