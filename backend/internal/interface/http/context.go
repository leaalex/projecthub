package handler

import (
	"errors"
	"net/http"

	"task-manager/backend/internal/application"
	"task-manager/backend/internal/domain/project"
	"task-manager/backend/internal/domain/report"
	"task-manager/backend/internal/domain/task"
	"task-manager/backend/internal/domain/user"
	"task-manager/backend/internal/middleware"

	"github.com/gin-gonic/gin"
)

func handleServiceError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, user.ErrUserNotFound),
		errors.Is(err, task.ErrTaskNotFound),
		errors.Is(err, project.ErrProjectNotFound),
		errors.Is(err, task.ErrSubtaskNotFound),
		errors.Is(err, report.ErrNotFound),
		errors.Is(err, application.ErrTargetUserNotFound),
		errors.Is(err, project.ErrNotMember),
		errors.Is(err, project.ErrSectionNotFound),
		errors.Is(err, task.ErrTaskSectionNotFound):
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})

	case errors.Is(err, application.ErrForbidden),
		errors.Is(err, project.ErrForbidden),
		errors.Is(err, project.ErrPersonalNoMembers),
		errors.Is(err, project.ErrTeamProjectNotAllowed):
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})

	case errors.Is(err, application.ErrInvalidInput),
		errors.Is(err, report.ErrInvalidFormat),
		errors.Is(err, report.ErrInvalidLayout),
		errors.Is(err, report.ErrInvalidGroupBy),
		errors.Is(err, report.ErrInvalidFields),
		errors.Is(err, application.ErrAssigneeNotProjectMember),
		errors.Is(err, task.ErrInvalidTitle),
		errors.Is(err, task.ErrInvalidStatus),
		errors.Is(err, task.ErrInvalidPriority),
		errors.Is(err, project.ErrCannotRemoveOwner),
		errors.Is(err, user.ErrCannotChangeOwnRole),
		errors.Is(err, user.ErrInvalidGlobalRole),
		errors.Is(err, application.ErrCannotTransferToSelf),
		errors.Is(err, application.ErrTargetNotProjectMember),
		errors.Is(err, application.ErrInvalidTaskTransfer),
		errors.Is(err, application.ErrDuplicateTaskTransfer),
		errors.Is(err, application.ErrCannotTransferToSameMember),
		errors.Is(err, application.ErrInvalidAssignee),
		errors.Is(err, application.ErrIncompleteTaskTransfer),
		errors.Is(err, project.ErrInvalidReorder),
		errors.Is(err, project.ErrOwnershipUnchanged),
		errors.Is(err, project.ErrInvalidProjectName),
		errors.Is(err, project.ErrInvalidMemberRole),
		errors.Is(err, project.ErrInvalidSectionName):
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})

	case errors.Is(err, user.ErrCannotDeleteSelf),
		errors.Is(err, project.ErrAlreadyMember),
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
