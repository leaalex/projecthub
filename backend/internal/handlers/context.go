package handlers

import (
	"net/http"
	"task-manager/backend/internal/middleware"
	"task-manager/backend/internal/models"
	"task-manager/backend/internal/services"

	"github.com/gin-gonic/gin"
)

func handleServiceError(c *gin.Context, err error) {
	switch err {
	case services.ErrTaskNotFound, services.ErrProjectNotFound,
		services.ErrSubtaskNotFound, services.ErrUserNotFound,
		services.ErrSavedReportNotFound, services.ErrTargetUserNotFound,
		services.ErrNotProjectMember:
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
	case services.ErrForbidden:
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
	case services.ErrInvalidInput, services.ErrAssigneeNotProjectMember:
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
	case services.ErrCannotDeleteSelf, services.ErrAlreadyProjectMember:
		c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
	case services.ErrCannotRemoveOwner:
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
	default:
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
	}
}

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
