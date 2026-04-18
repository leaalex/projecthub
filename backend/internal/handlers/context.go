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
	// Ошибки «не найдено» (404)
	case services.ErrTaskNotFound, services.ErrProjectNotFound,
		services.ErrSubtaskNotFound, services.ErrUserNotFound,
		services.ErrSavedReportNotFound, services.ErrTargetUserNotFound,
		services.ErrNotProjectMember, services.ErrTaskSectionNotFound:
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})

	// Ошибки доступа (403)
	case services.ErrForbidden, services.ErrPersonalProjectMembersNotAllowed,
		services.ErrTeamProjectNotAllowed:
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})

	// Ошибки некорректного запроса (400)
	case services.ErrInvalidInput, services.ErrAssigneeNotProjectMember,
		services.ErrCannotRemoveOwner, services.ErrCannotChangeOwnRole,
		services.ErrInvalidGlobalRole, services.ErrCannotTransferToSelf,
		services.ErrTargetNotProjectMember, services.ErrInvalidTaskTransfer,
		services.ErrDuplicateTaskTransfer, services.ErrCannotTransferToSameMember,
		services.ErrInvalidAssignee, services.ErrIncompleteTaskTransfer:
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})

	// Ошибки конфликта (409)
	case services.ErrCannotDeleteSelf, services.ErrAlreadyProjectMember,
		services.ErrEmailTaken:
		c.JSON(http.StatusConflict, gin.H{"error": err.Error()})

	// Ошибки аутентификации (401)
	case services.ErrInvalidCreds:
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})

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
