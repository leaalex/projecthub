package middleware

import (
	"net/http"
	"strings"

	"task-manager/backend/internal/domain/user"
	"task-manager/backend/internal/infrastructure/auth"

	"github.com/gin-gonic/gin"
)

const ContextUserIDKey = "user_id"
const ContextRoleKey = "role"

// JWTAuth проверяет Bearer-токен и записывает user_id и role в контекст.
func JWTAuth(secret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		h := c.GetHeader("Authorization")
		if h == "" || !strings.HasPrefix(strings.ToLower(h), "bearer ") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing or invalid authorization"})
			return
		}
		raw := strings.TrimSpace(h[7:])
		claims, err := auth.ParseJWT(raw, secret)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
			return
		}
		c.Set(ContextUserIDKey, claims.UserID)
		r, _ := user.ParseRole(claims.Role)
		c.Set(ContextRoleKey, normalizeRole(r))
		c.Next()
	}
}

// SyncRoleFromDB перезаписывает роль в контексте актуальным значением из базы данных.
func SyncRoleFromDB(repo user.Repository) gin.HandlerFunc {
	return func(c *gin.Context) {
		uid, ok := c.Get(ContextUserIDKey)
		if !ok {
			c.Next()
			return
		}
		userID, ok := uid.(uint)
		if !ok {
			c.Next()
			return
		}
		u, err := repo.FindByID(c.Request.Context(), user.ID(userID))
		if err != nil {
			c.Next()
			return
		}
		c.Set(ContextRoleKey, normalizeRole(u.Role()))
		c.Next()
	}
}

func normalizeRole(r user.Role) user.Role {
	switch r {
	case "member":
		return user.RoleUser
	case "manager":
		return user.RoleCreator
	default:
		return r
	}
}

// RequireAdmin прерывает запрос с ошибкой 403, если роль в JWT не admin.
func RequireAdmin() gin.HandlerFunc {
	return func(c *gin.Context) {
		r, ok := c.Get(ContextRoleKey)
		if !ok {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "forbidden"})
			return
		}
		role, ok := r.(user.Role)
		if !ok || role != user.RoleAdmin {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "admin only"})
			return
		}
		c.Next()
	}
}

// RequireStaffOrAdmin прерывает запрос с ошибкой 403, если роль в JWT не admin и не staff.
func RequireStaffOrAdmin() gin.HandlerFunc {
	return func(c *gin.Context) {
		r, ok := c.Get(ContextRoleKey)
		if !ok {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "forbidden"})
			return
		}
		role, ok := r.(user.Role)
		if !ok || (role != user.RoleAdmin && role != user.RoleStaff) {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "staff or admin only"})
			return
		}
		c.Next()
	}
}

// RequireCreatorOrAbove блокирует глобальную роль «user» (только чтение до приглашения в проект).
func RequireCreatorOrAbove() gin.HandlerFunc {
	return func(c *gin.Context) {
		r, ok := c.Get(ContextRoleKey)
		if !ok {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "forbidden"})
			return
		}
		role, ok := r.(user.Role)
		if !ok || role == user.RoleUser {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "creator role or above required"})
			return
		}
		c.Next()
	}
}
