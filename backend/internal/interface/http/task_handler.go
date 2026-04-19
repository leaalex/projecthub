package handler

import (
	"context"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"task-manager/backend/internal/application"
	"task-manager/backend/internal/domain/task"
	"task-manager/backend/internal/domain/user"
)

// TaskHandler — HTTP-обработчики задач.
type TaskHandler struct {
	Tasks     *application.TaskService
	Move      *application.TaskMoveService
	AssignSvc *application.TaskAssignService
	TaskTrash *application.TaskTrashService
	Notes     *application.NoteService
	Users     user.Repository
}

type taskCreateBody struct {
	Title       string `json:"title" binding:"required"`
	Description string `json:"description"`
	ProjectID   uint   `json:"project_id" binding:"required"`
	SectionID   *uint  `json:"section_id"`
	Status      string `json:"status"`
	Priority    string `json:"priority"`
}

type taskUpdateBody struct {
	Title       *string `json:"title"`
	Description *string `json:"description"`
	Status      *string `json:"status"`
	Priority    *string `json:"priority"`
	ProjectID   *uint   `json:"project_id"`
	DueDate     *string `json:"due_date"`
}

type assignBody struct {
	AssigneeID uint `json:"assignee_id"`
}

type moveTaskBody struct {
	TaskID    uint  `json:"task_id" binding:"required"`
	SectionID *uint `json:"section_id"`
	Position  *int  `json:"position"`
}

func (h *TaskHandler) enrichAssignee(ctx context.Context, t *task.Task) *user.User {
	if h.Users == nil || t.AssigneeID() == nil {
		return nil
	}
	u, err := h.Users.FindByID(ctx, *t.AssigneeID())
	if err != nil {
		return nil
	}
	return u
}

func (h *TaskHandler) List(c *gin.Context) {
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
	var projectID *uint
	if p := c.Query("project_id"); p != "" {
		n, err := strconv.ParseUint(p, 10, 32)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "bad project_id"})
			return
		}
		v := uint(n)
		projectID = &v
	}
	var status *string
	if s := c.Query("status"); s != "" {
		status = &s
	}
	tasks, err := h.Tasks.List(c.Request.Context(), uid, role, projectID, status)
	if err != nil {
		handleServiceError(c, err)
		return
	}
	out := make([]gin.H, 0, len(tasks))
	for _, t := range tasks {
		acl, err := h.Tasks.CallerTaskACL(c.Request.Context(), t, uid, role)
		if err != nil {
			handleServiceError(c, err)
			return
		}
		out = append(out, taskToJSON(t, nil, 0, h.enrichAssignee(c.Request.Context(), t), acl))
	}
	c.JSON(http.StatusOK, gin.H{"tasks": out})
}

func (h *TaskHandler) Create(c *gin.Context) {
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
	var body taskCreateBody
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	t, err := h.Tasks.Create(c.Request.Context(), uid, role, application.TaskCreate{
		Title:       body.Title,
		Description: body.Description,
		ProjectID:   body.ProjectID,
		SectionID:   body.SectionID,
		Status:      body.Status,
		Priority:    body.Priority,
	})
	if err != nil {
		handleServiceError(c, err)
		return
	}
	acl, _ := h.Tasks.CallerTaskACL(c.Request.Context(), t, uid, role)
	c.JSON(http.StatusCreated, gin.H{"task": taskToJSON(t, nil, 0, h.enrichAssignee(c.Request.Context(), t), acl)})
}

func (h *TaskHandler) Get(c *gin.Context) {
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
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "bad id"})
		return
	}
	t, err := h.Tasks.Get(c.Request.Context(), uint(id), uid, role)
	if err != nil {
		handleServiceError(c, err)
		return
	}
	acl, _ := h.Tasks.CallerTaskACL(c.Request.Context(), t, uid, role)

	// Enrich with linked notes for detail view.
	var notePreviews []linkedNotePreview
	if h.Notes != nil {
		linked, err := h.Notes.ListLinkedNotes(c.Request.Context(), uint(id), uid, role)
		if err != nil {
			handleServiceError(c, err)
			return
		}
		for _, n := range linked {
			notePreviews = append(notePreviews, linkedNotePreview{ID: n.ID().Uint(), Title: n.Title()})
		}
	}
	c.JSON(http.StatusOK, gin.H{"task": taskToJSONWithNotes(t, nil, 0, h.enrichAssignee(c.Request.Context(), t), acl, notePreviews)})
}

func (h *TaskHandler) Update(c *gin.Context) {
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
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "bad id"})
		return
	}
	var body taskUpdateBody
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	t, err := h.Tasks.Update(c.Request.Context(), uint(id), uid, role, application.TaskUpdate{
		Title:       body.Title,
		Description: body.Description,
		Status:      body.Status,
		Priority:    body.Priority,
		ProjectID:   body.ProjectID,
		DueDate:     body.DueDate,
	})
	if err != nil {
		handleServiceError(c, err)
		return
	}
	acl, _ := h.Tasks.CallerTaskACL(c.Request.Context(), t, uid, role)
	c.JSON(http.StatusOK, gin.H{"task": taskToJSON(t, nil, 0, h.enrichAssignee(c.Request.Context(), t), acl)})
}

func (h *TaskHandler) Delete(c *gin.Context) {
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
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "bad id"})
		return
	}
	permanent := c.DefaultQuery("permanent", "false") == "true"
	if permanent && h.TaskTrash != nil {
		// Задача может быть уже в корзине — используем Unscoped-поиск.
		t, ferr := h.Tasks.Tasks.FindByIDUnscoped(c.Request.Context(), task.ID(uint(id)))
		if ferr != nil {
			handleServiceError(c, ferr)
			return
		}
		if ferr := h.TaskTrash.HardDelete(c.Request.Context(), uint(id), t.ProjectID().Uint(), uid, role); ferr != nil {
			handleServiceError(c, ferr)
			return
		}
	} else {
		if err := h.Tasks.Delete(c.Request.Context(), uint(id), uid, role); err != nil {
			handleServiceError(c, err)
			return
		}
	}
	c.Status(http.StatusNoContent)
}

// RestoreTask восстанавливает задачу из корзины.
func (h *TaskHandler) RestoreTask(c *gin.Context) {
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
	if err := h.TaskTrash.Restore(c.Request.Context(), uint(taskID), uint(projectID), uid, role); err != nil {
		handleServiceError(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *TaskHandler) AssignUser(c *gin.Context) {
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
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "bad id"})
		return
	}
	var body assignBody
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	t, err := h.AssignSvc.Assign(c.Request.Context(), uint(id), uid, role, body.AssigneeID)
	if err != nil {
		handleServiceError(c, err)
		return
	}
	acl, _ := h.Tasks.CallerTaskACL(c.Request.Context(), t, uid, role)
	c.JSON(http.StatusOK, gin.H{"task": taskToJSON(t, nil, 0, h.enrichAssignee(c.Request.Context(), t), acl)})
}

func (h *TaskHandler) Complete(c *gin.Context) {
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
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "bad id"})
		return
	}
	t, err := h.Tasks.Complete(c.Request.Context(), uint(id), uid, role)
	if err != nil {
		handleServiceError(c, err)
		return
	}
	acl, _ := h.Tasks.CallerTaskACL(c.Request.Context(), t, uid, role)
	c.JSON(http.StatusOK, gin.H{"task": taskToJSON(t, nil, 0, h.enrichAssignee(c.Request.Context(), t), acl)})
}

func (h *TaskHandler) MoveInProject(c *gin.Context) {
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
	projectIDRaw, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "bad project id"})
		return
	}
	var body moveTaskBody
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	t, err := h.Move.Move(c.Request.Context(), uid, role, application.TaskMoveInput{
		TaskID:    body.TaskID,
		ProjectID: uint(projectIDRaw),
		SectionID: body.SectionID,
		Position:  body.Position,
	})
	if err != nil {
		handleServiceError(c, err)
		return
	}
	acl, _ := h.Tasks.CallerTaskACL(c.Request.Context(), t, uid, role)
	c.JSON(http.StatusOK, gin.H{"task": taskToJSON(t, nil, 0, h.enrichAssignee(c.Request.Context(), t), acl)})
}
