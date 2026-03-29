package middleware

import (
	"net/http"
	"strings"

	"task-manager/backend/internal/models"
	"task-manager/backend/internal/utils"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
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
		c.Set(ContextRoleKey, normalizeRole(models.Role(claims.Role)))
		c.Next()
	}
}

// SyncRoleFromDB overwrites context role with the current value from the database.
// JWT may still carry an old role after an admin changes the user's global role;
// /me already reads from DB, so without this, staff could see the UI but get 403 on /users.
func SyncRoleFromDB(db *gorm.DB) gin.HandlerFunc {
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
		var u models.User
		if err := db.Select("role").First(&u, userID).Error; err != nil {
			c.Next()
			return
		}
		c.Set(ContextRoleKey, normalizeRole(u.Role))
		c.Next()
	}
}

func normalizeRole(r models.Role) models.Role {
	switch r {
	case "member":
		return models.RoleUser
	case "manager":
		return models.RoleCreator
	default:
		return r
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

// RequireStaffOrAdmin aborts with 403 unless JWT role is admin or staff.
func RequireStaffOrAdmin() gin.HandlerFunc {
	return func(c *gin.Context) {
		r, ok := c.Get(ContextRoleKey)
		if !ok {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "forbidden"})
			return
		}
		role, ok := r.(models.Role)
		if !ok || (role != models.RoleAdmin && role != models.RoleStaff) {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "staff or admin only"})
			return
		}
		c.Next()
	}
}

// RequireCreatorOrAbove blocks global role "user" (read-only until invited to a project).
func RequireCreatorOrAbove() gin.HandlerFunc {
	return func(c *gin.Context) {
		r, ok := c.Get(ContextRoleKey)
		if !ok {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "forbidden"})
			return
		}
		role, ok := r.(models.Role)
		if !ok || role == models.RoleUser {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "creator role or above required"})
			return
		}
		c.Next()
	}
}
