package user

import "golang.org/x/crypto/bcrypt"

const bcryptCost = 12

// PasswordHash — хеш пароля (bcrypt).
type PasswordHash string

func HashPassword(plain string) (PasswordHash, error) {
	b, err := bcrypt.GenerateFromPassword([]byte(plain), bcryptCost)
	if err != nil {
		return "", err
	}
	return PasswordHash(b), nil
}

func PasswordHashFromStored(s string) PasswordHash {
	return PasswordHash(s)
}

func (h PasswordHash) String() string {
	return string(h)
}

func (h PasswordHash) Matches(plain string) error {
	return bcrypt.CompareHashAndPassword([]byte(h), []byte(plain))
}
