package handlers

import (
	"errors"
	"net/http"

	"task-manager/backend/internal/application"
	"task-manager/backend/internal/domain/user"
	"task-manager/backend/internal/middleware"
	"task-manager/backend/internal/services"

	"github.com/gin-gonic/gin"
)

func handleServiceError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, user.ErrUserNotFound),
		errors.Is(err, services.ErrTaskNotFound),
		errors.Is(err, services.ErrProjectNotFound),
		errors.Is(err, services.ErrSubtaskNotFound),
		errors.Is(err, services.ErrSavedReportNotFound),
		errors.Is(err, services.ErrTargetUserNotFound),
		errors.Is(err, services.ErrNotProjectMember),
		errors.Is(err, services.ErrTaskSectionNotFound):
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})

	case errors.Is(err, services.ErrForbidden),
		errors.Is(err, services.ErrPersonalProjectMembersNotAllowed),
		errors.Is(err, services.ErrTeamProjectNotAllowed):
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})

	case errors.Is(err, services.ErrInvalidInput),
		errors.Is(err, application.ErrInvalidInput),
		errors.Is(err, services.ErrAssigneeNotProjectMember),
		errors.Is(err, services.ErrCannotRemoveOwner),
		errors.Is(err, user.ErrCannotChangeOwnRole),
		errors.Is(err, user.ErrInvalidGlobalRole),
		errors.Is(err, services.ErrCannotTransferToSelf),
		errors.Is(err, services.ErrTargetNotProjectMember),
		errors.Is(err, services.ErrInvalidTaskTransfer),
		errors.Is(err, services.ErrDuplicateTaskTransfer),
		errors.Is(err, services.ErrCannotTransferToSameMember),
		errors.Is(err, services.ErrInvalidAssignee),
		errors.Is(err, services.ErrIncompleteTaskTransfer):
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})

	case errors.Is(err, user.ErrCannotDeleteSelf),
		errors.Is(err, services.ErrAlreadyProjectMember),
		errors.Is(err, user.ErrEmailTaken):
		c.JSON(http.StatusConflict, gin.H{"error": err.Error()})

	case errors.Is(err, application.ErrInvalidCreds),
		errors.Is(err, application.ErrInvalidRefreshToken):
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

func ctxRole(c *gin.Context) (user.Role, bool) {
	v, ok := c.Get(middleware.ContextRoleKey)
	if !ok {
		return "", false
	}
	r, ok := v.(user.Role)
	return r, ok
}
