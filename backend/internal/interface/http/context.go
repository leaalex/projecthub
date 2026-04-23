package handler

import (
	"errors"
	"net/http"
	"strings"

	"task-manager/backend/internal/application"
	"task-manager/backend/internal/domain/note"
	"task-manager/backend/internal/domain/project"
	"task-manager/backend/internal/domain/report"
	"task-manager/backend/internal/domain/session"
	"task-manager/backend/internal/domain/task"
	"task-manager/backend/internal/domain/user"
	"task-manager/backend/internal/middleware"

	"github.com/gin-gonic/gin"
)

func handleServiceError(c *gin.Context, err error) {
	if k := sqliteConstraintKind(err); k != "" {
		_ = c.Error(err)
		body := gin.H{"error": k}
		if gin.Mode() != gin.ReleaseMode {
			body["detail"] = err.Error()
		}
		c.JSON(http.StatusConflict, body)
		return
	}

	code, status := mapServiceError(err)
	body := gin.H{"error": code}
	if gin.Mode() != gin.ReleaseMode {
		body["detail"] = err.Error()
	}
	if status >= http.StatusInternalServerError {
		_ = c.Error(err)
	}
	c.JSON(status, body)
}

// mapServiceError maps domain/application errors to stable API codes and HTTP status.
func mapServiceError(err error) (code string, status int) {
	if err == nil {
		return "internal_error", http.StatusInternalServerError
	}

	switch {
	case errors.Is(err, user.ErrUserNotFound),
		errors.Is(err, application.ErrTargetUserNotFound):
		return "user_not_found", http.StatusNotFound
	case errors.Is(err, task.ErrTaskNotFound):
		return "task_not_found", http.StatusNotFound
	case errors.Is(err, project.ErrProjectNotFound):
		return "project_not_found", http.StatusNotFound
	case errors.Is(err, task.ErrSubtaskNotFound):
		return "subtask_not_found", http.StatusNotFound
	case errors.Is(err, report.ErrNotFound):
		return "report_not_found", http.StatusNotFound
	case errors.Is(err, note.ErrNoteNotFound):
		return "note_not_found", http.StatusNotFound
	case errors.Is(err, project.ErrNotMember):
		return "not_member", http.StatusNotFound
	case errors.Is(err, project.ErrSectionNotFound):
		return "section_not_found", http.StatusNotFound
	case errors.Is(err, task.ErrTaskSectionNotFound):
		return "task_section_not_found", http.StatusNotFound
	case errors.Is(err, session.ErrSessionNotFound):
		return "session_not_found", http.StatusUnauthorized
	case errors.Is(err, session.ErrSessionExpired):
		return "session_expired", http.StatusUnauthorized
	case errors.Is(err, session.ErrSessionRevoked):
		return "session_revoked", http.StatusUnauthorized

	case errors.Is(err, application.ErrForbidden),
		errors.Is(err, project.ErrForbidden):
		return "forbidden", http.StatusForbidden
	case errors.Is(err, project.ErrPersonalNoMembers):
		return "personal_no_members", http.StatusForbidden
	case errors.Is(err, project.ErrTeamProjectNotAllowed):
		return "team_project_not_allowed", http.StatusForbidden

	case errors.Is(err, application.ErrInvalidInput):
		return "invalid_input", http.StatusBadRequest
	case errors.Is(err, report.ErrInvalidFormat):
		return "invalid_report_format", http.StatusBadRequest
	case errors.Is(err, report.ErrInvalidLayout):
		return "invalid_pdf_layout", http.StatusBadRequest
	case errors.Is(err, report.ErrInvalidGroupBy):
		return "invalid_group_by", http.StatusBadRequest
	case errors.Is(err, report.ErrInvalidFields):
		return "invalid_report_fields", http.StatusBadRequest
	case errors.Is(err, report.ErrReportsDirUnset):
		return "reports_dir_unset", http.StatusInternalServerError
	case errors.Is(err, application.ErrAssigneeNotProjectMember):
		return "assignee_not_project_member", http.StatusBadRequest
	case errors.Is(err, task.ErrInvalidTitle):
		return "invalid_title", http.StatusBadRequest
	case errors.Is(err, task.ErrInvalidStatus):
		return "invalid_status", http.StatusBadRequest
	case errors.Is(err, task.ErrInvalidPriority):
		return "invalid_priority", http.StatusBadRequest
	case errors.Is(err, note.ErrTitleRequired):
		return "title_required", http.StatusBadRequest
	case errors.Is(err, note.ErrTaskOtherProject):
		return "task_other_project", http.StatusBadRequest
	case errors.Is(err, project.ErrCannotRemoveOwner):
		return "cannot_remove_owner", http.StatusBadRequest
	case errors.Is(err, user.ErrCannotChangeOwnRole):
		return "cannot_change_own_role", http.StatusBadRequest
	case errors.Is(err, user.ErrInvalidGlobalRole):
		return "invalid_global_role", http.StatusBadRequest
	case errors.Is(err, user.ErrInvalidEmail):
		return "invalid_email", http.StatusBadRequest
	case errors.Is(err, user.ErrInvalidLocale):
		return "invalid_locale", http.StatusBadRequest
	case errors.Is(err, user.ErrInvalidPassword):
		return "invalid_password", http.StatusBadRequest
	case errors.Is(err, application.ErrCannotTransferToSelf):
		return "cannot_transfer_to_self", http.StatusBadRequest
	case errors.Is(err, application.ErrTargetNotProjectMember):
		return "target_not_project_member", http.StatusBadRequest
	case errors.Is(err, application.ErrInvalidTaskTransfer):
		return "invalid_task_transfer", http.StatusBadRequest
	case errors.Is(err, application.ErrDuplicateTaskTransfer):
		return "duplicate_task_transfer", http.StatusBadRequest
	case errors.Is(err, application.ErrCannotTransferToSameMember):
		return "cannot_transfer_to_same_member", http.StatusBadRequest
	case errors.Is(err, application.ErrInvalidAssignee):
		return "invalid_assignee", http.StatusBadRequest
	case errors.Is(err, application.ErrIncompleteTaskTransfer):
		return "incomplete_task_transfer", http.StatusBadRequest
	case errors.Is(err, project.ErrInvalidReorder):
		return "invalid_reorder", http.StatusBadRequest
	case errors.Is(err, project.ErrOwnershipUnchanged):
		return "ownership_unchanged", http.StatusBadRequest
	case errors.Is(err, project.ErrInvalidProjectName):
		return "invalid_project_name", http.StatusBadRequest
	case errors.Is(err, project.ErrInvalidMemberRole):
		return "invalid_member_role", http.StatusBadRequest
	case errors.Is(err, project.ErrInvalidSectionName):
		return "invalid_section_name", http.StatusBadRequest
	case errors.Is(err, project.ErrInvalidSectionDisplayMode):
		return "invalid_section_display_mode", http.StatusBadRequest

	case errors.Is(err, user.ErrCannotDeleteSelf):
		return "cannot_delete_self", http.StatusConflict
	case errors.Is(err, project.ErrAlreadyMember):
		return "already_member", http.StatusConflict
	case errors.Is(err, note.ErrLinkAlreadyExists):
		return "link_already_exists", http.StatusConflict
	case errors.Is(err, user.ErrEmailTaken):
		return "email_taken", http.StatusConflict

	case errors.Is(err, application.ErrInvalidCreds):
		return "invalid_credentials", http.StatusUnauthorized
	case errors.Is(err, application.ErrInvalidRefreshToken):
		return "invalid_refresh_token", http.StatusUnauthorized

	default:
		return "internal_error", http.StatusInternalServerError
	}
}

// sqliteConstraintKind maps SQLite driver errors to stable API codes.
// SQLite does not include table/column names in the message.
func sqliteConstraintKind(err error) string {
	if err == nil {
		return ""
	}
	msg := err.Error()
	switch {
	case strings.Contains(msg, "FOREIGN KEY constraint failed"):
		return "foreign_key_violation"
	case strings.Contains(msg, "UNIQUE constraint failed"):
		return "unique_violation"
	case strings.Contains(msg, "NOT NULL constraint failed"):
		return "not_null_violation"
	default:
		return ""
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
