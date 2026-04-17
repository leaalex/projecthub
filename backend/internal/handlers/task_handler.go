package handlers

import (
	"net/http"
	"strconv"

	"task-manager/backend/internal/models"
	"task-manager/backend/internal/services"

	"github.com/gin-gonic/gin"
)

type TaskHandler struct {
	Svc *services.TaskService
}

type taskCreateBody struct {
	Title       string             `json:"title" binding:"required"`
	Description string             `json:"description"`
	ProjectID   uint               `json:"project_id" binding:"required"`
	SectionID   *uint              `json:"section_id"`
	Status      models.TaskStatus  `json:"status"`
	Priority    models.TaskPriority `json:"priority"`
}

type taskUpdateBody struct {
	Title       *string              `json:"title"`
	Description *string              `json:"description"`
	Status      *models.TaskStatus   `json:"status"`
	Priority    *models.TaskPriority `json:"priority"`
	ProjectID   *uint                `json:"project_id"`
	DueDate     *string              `json:"due_date"` // ISO date (YYYY-MM-DD) or empty string to clear
}

type assignBody struct {
	// 0 means unassign (clear assignee). Non-zero assigns that user.
	AssigneeID uint `json:"assignee_id"`
}

type moveTaskBody struct {
	TaskID    uint               `json:"task_id" binding:"required"`
	SectionID *uint              `json:"section_id"`
	Status    *models.TaskStatus `json:"status"`
	Position  *int               `json:"position"`
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
	var status *models.TaskStatus
	if s := c.Query("status"); s != "" {
		st := models.TaskStatus(s)
		status = &st
	}
	tasks, err := h.Svc.List(uid, role, projectID, status)
	if err != nil {
		handleServiceError(c, err)
		return
	}
	if err := h.Svc.AttachCallerACLBatch(tasks, uid, role); err != nil {
		handleServiceError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"tasks": tasks})
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
	t, err := h.Svc.Create(uid, role, services.TaskCreate{
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
	_ = h.Svc.AttachCallerACL(t, uid, role)
	c.JSON(http.StatusCreated, gin.H{"task": t})
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
	t, err := h.Svc.Get(uint(id), uid, role)
	if err != nil {
		handleServiceError(c, err)
		return
	}
	_ = h.Svc.AttachCallerACL(t, uid, role)
	c.JSON(http.StatusOK, gin.H{"task": t})
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
	t, err := h.Svc.Update(uint(id), uid, role, services.TaskUpdate{
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
	_ = h.Svc.AttachCallerACL(t, uid, role)
	c.JSON(http.StatusOK, gin.H{"task": t})
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
	if err := h.Svc.Delete(uint(id), uid, role); err != nil {
		handleServiceError(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *TaskHandler) Assign(c *gin.Context) {
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
	t, err := h.Svc.Assign(uint(id), uid, role, body.AssigneeID)
	if err != nil {
		handleServiceError(c, err)
		return
	}
	_ = h.Svc.AttachCallerACL(t, uid, role)
	c.JSON(http.StatusOK, gin.H{"task": t})
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
	t, err := h.Svc.Complete(uint(id), uid, role)
	if err != nil {
		handleServiceError(c, err)
		return
	}
	_ = h.Svc.AttachCallerACL(t, uid, role)
	c.JSON(http.StatusOK, gin.H{"task": t})
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
	t, err := h.Svc.Move(uid, role, services.TaskMoveInput{
		TaskID:    body.TaskID,
		ProjectID: uint(projectIDRaw),
		SectionID: body.SectionID,
		Status:    body.Status,
		Position:  body.Position,
	})
	if err != nil {
		handleServiceError(c, err)
		return
	}
	_ = h.Svc.AttachCallerACL(t, uid, role)
	c.JSON(http.StatusOK, gin.H{"task": t})
}
