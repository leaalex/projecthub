package middleware

import (
	"net/http"
	"strings"

	"task-manager/backend/internal/models"
	"task-manager/backend/internal/utils"

	"github.com/gin-gonic/gin"
)

const ContextUserIDKey = "user_id"
const ContextRoleKey = "role"

// JWTAuth validates Bearer token and sets user_id and role in context.
func JWTAuth(secret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		h := c.GetHeader("Authorization")
		if h == "" || !strings.HasPrefix(strings.ToLower(h), "bearer ") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing or invalid authorization"})
			return
		}
		raw := strings.TrimSpace(h[7:])
		claims, err := utils.ParseJWT(raw, secret)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
			return
		}
		c.Set(ContextUserIDKey, claims.UserID)
		c.Set(ContextRoleKey, models.Role(claims.Role))
		c.Next()
	}
}

// RequireAdmin aborts with 403 unless JWT role is admin.
func RequireAdmin() gin.HandlerFunc {
	return func(c *gin.Context) {
		r, ok := c.Get(ContextRoleKey)
		if !ok {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "forbidden"})
			return
		}
		role, ok := r.(models.Role)
		if !ok || role != models.RoleAdmin {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "admin only"})
			return
		}
		c.Next()
	}
}
