package utils

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type Claims struct {
	UserID    uint   `json:"uid"`
	Role      string `json:"role"`
	TokenType string `json:"typ,omitempty"`
	jwt.RegisteredClaims
}

const AccessTokenType = "access"

// SignJWT подписывает access-JWT с заданным TTL (если ttl <= 0, используется 15 минут).
func SignJWT(userID uint, role string, secret string, ttl time.Duration) (string, error) {
	if ttl <= 0 {
		ttl = 15 * time.Minute
	}
	if role == "" {
		role = "user"
	}
	now := time.Now()
	claims := Claims{
		UserID:    userID,
		Role:      role,
		TokenType: AccessTokenType,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(now.Add(ttl)),
			IssuedAt:  jwt.NewNumericDate(now),
		},
	}
	t := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return t.SignedString([]byte(secret))
}

func ParseJWT(tokenString, secret string) (*Claims, error) {
	t, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(secret), nil
	})
	if err != nil {
		return nil, err
	}
	claims, ok := t.Claims.(*Claims)
	if !ok || !t.Valid {
		return nil, errors.New("invalid token")
	}
	if claims.Role == "" {
		claims.Role = "user"
	}
	if claims.TokenType != "" && claims.TokenType != AccessTokenType {
		return nil, errors.New("invalid token")
	}
	return claims, nil
}
