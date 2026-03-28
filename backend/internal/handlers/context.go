package handlers

import (
	"task-manager/backend/internal/middleware"
	"task-manager/backend/internal/models"

	"github.com/gin-gonic/gin"
)

func ctxUserID(c *gin.Context) (uint, bool) {
	v, ok := c.Get(middleware.ContextUserIDKey)
	if !ok {
		return 0, false
	}
	id, ok := v.(uint)
	return id, ok
}

func ctxRole(c *gin.Context) (models.Role, bool) {
	v, ok := c.Get(middleware.ContextRoleKey)
	if !ok {
		return "", false
	}
	r, ok := v.(models.Role)
	return r, ok
}
