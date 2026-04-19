package handler

import (
	"context"
	"net/http"
	"strconv"

	"task-manager/backend/internal/application"
	"task-manager/backend/internal/domain/note"
	"task-manager/backend/internal/domain/task"
	"task-manager/backend/internal/domain/user"

	"github.com/gin-gonic/gin"
)

// TrashHandler — HTTP-обработчики корзины проекта.
type TrashHandler struct {
	TaskTrash *application.TaskTrashService
	Notes     *application.NoteService
	// TaskSvc — основной сервис задач (ACL для JSON при GetDeletedTask).
	TaskSvc *application.TaskService
	Users   user.Repository
}

func (h *TrashHandler) ListDeletedTasks(c *gin.Context) {
	uid, ok := ctxUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	role, ok := ctxRole(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	projectID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "bad project id"})
		return
	}
	tasks, err := h.TaskTrash.ListDeleted(c.Request.Context(), uint(projectID), uid, role)
	if err != nil {
		handleServiceError(c, err)
		return
	}
	out := make([]gin.H, 0, len(tasks))
	for _, t := range tasks {
		out = append(out, taskToJSON(t, nil, 0, nil, application.TaskCallerACL{}))
	}
	c.JSON(http.StatusOK, gin.H{"tasks": out})
}

func (h *TrashHandler) ListDeletedNotes(c *gin.Context) {
	uid, ok := ctxUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	role, ok := ctxRole(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	projectID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "bad project id"})
		return
	}
	notes, err := h.Notes.ListDeleted(c.Request.Context(), uint(projectID), uid, role)
	if err != nil {
		handleServiceError(c, err)
		return
	}
	out := make([]gin.H, 0, len(notes))
	for _, n := range notes {
		out = append(out, noteToJSONForTrash(n))
	}
	c.JSON(http.StatusOK, gin.H{"notes": out})
}

func (h *TrashHandler) enrichAssignee(ctx context.Context, t *task.Task) *user.User {
	if h.Users == nil || t.AssigneeID() == nil {
		return nil
	}
	u, err := h.Users.FindByID(ctx, *t.AssigneeID())
	if err != nil {
		return nil
	}
	return u
}

// GetDeletedTask возвращает одну мягко удалённую задачу (полное тело для модалки корзины).
func (h *TrashHandler) GetDeletedTask(c *gin.Context) {
	uid, ok := ctxUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	role, ok := ctxRole(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	projectID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "bad project id"})
		return
	}
	taskID, err := strconv.ParseUint(c.Param("taskId"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "bad task id"})
		return
	}
	t, err := h.TaskTrash.Get(c.Request.Context(), uint(taskID), uint(projectID), uid, role)
	if err != nil {
		handleServiceError(c, err)
		return
	}
	var acl application.TaskCallerACL
	if h.TaskSvc != nil {
		acl, _ = h.TaskSvc.CallerTaskACL(c.Request.Context(), t, uid, role)
	}
	var previews []linkedNotePreview
	c.JSON(http.StatusOK, gin.H{
		"task": taskToJSONWithNotes(t, nil, 0, h.enrichAssignee(c.Request.Context(), t), acl, previews),
	})
}

// GetDeletedNote возвращает одну мягко удалённую заметку (включая body).
func (h *TrashHandler) GetDeletedNote(c *gin.Context) {
	uid, ok := ctxUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	role, ok := ctxRole(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	projectID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "bad project id"})
		return
	}
	noteID, err := strconv.ParseUint(c.Param("noteId"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "bad note id"})
		return
	}
	n, err := h.Notes.GetDeleted(c.Request.Context(), uint(noteID), uint(projectID), uid, role)
	if err != nil {
		handleServiceError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"note": noteToJSON(n)})
}

func noteToJSONForTrash(n *note.Note) gin.H {
	var secID *uint
	if sid := n.SectionID(); sid != nil {
		v := sid.Uint()
		secID = &v
	}
	return gin.H{
		"id":         n.ID().Uint(),
		"project_id": n.ProjectID().Uint(),
		"section_id": secID,
		"title":      n.Title(),
		"created_at": n.CreatedAt(),
		"updated_at": n.UpdatedAt(),
	}
}
