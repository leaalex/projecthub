package handler

import (
	"net/http"
	"strconv"

	"task-manager/backend/internal/application"

	"github.com/gin-gonic/gin"
)

// SubtaskHandler — HTTP-обработчики подзадач.
type SubtaskHandler struct {
	Tasks *application.TaskService
}

type subtaskCreateBody struct {
	Title string `json:"title" binding:"required"`
}

type subtaskUpdateBody struct {
	Title    *string `json:"title"`
	Done     *bool   `json:"done"`
	Position *int    `json:"position"`
}

func (h *SubtaskHandler) List(c *gin.Context) {
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
	taskID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "bad id"})
		return
	}
	list, err := h.Tasks.ListSubtasks(c.Request.Context(), uint(taskID), uid, role)
	if err != nil {
		handleServiceError(c, err)
		return
	}
	out := make([]gin.H, 0, len(list))
	for _, s := range list {
		out = append(out, subtaskToJSON(s))
	}
	c.JSON(http.StatusOK, gin.H{"subtasks": out})
}

func (h *SubtaskHandler) Create(c *gin.Context) {
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
	taskID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "bad id"})
		return
	}
	var body subtaskCreateBody
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	st, err := h.Tasks.CreateSubtask(c.Request.Context(), uint(taskID), uid, role, body.Title)
	if err != nil {
		handleServiceError(c, err)
		return
	}
	c.JSON(http.StatusCreated, gin.H{"subtask": subtaskToJSON(st)})
}

func (h *SubtaskHandler) Update(c *gin.Context) {
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
	taskID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "bad id"})
		return
	}
	sid, err := strconv.ParseUint(c.Param("sid"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "bad subtask id"})
		return
	}
	var body subtaskUpdateBody
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	st, err := h.Tasks.UpdateSubtask(c.Request.Context(), uint(taskID), uint(sid), uid, role, application.SubtaskUpdate{
		Title:    body.Title,
		Done:     body.Done,
		Position: body.Position,
	})
	if err != nil {
		handleServiceError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"subtask": subtaskToJSON(st)})
}

func (h *SubtaskHandler) Delete(c *gin.Context) {
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
	taskID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "bad id"})
		return
	}
	sid, err := strconv.ParseUint(c.Param("sid"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "bad subtask id"})
		return
	}
	if err := h.Tasks.DeleteSubtask(c.Request.Context(), uint(taskID), uint(sid), uid, role); err != nil {
		handleServiceError(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *SubtaskHandler) Toggle(c *gin.Context) {
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
	taskID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "bad id"})
		return
	}
	sid, err := strconv.ParseUint(c.Param("sid"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "bad subtask id"})
		return
	}
	st, err := h.Tasks.ToggleSubtask(c.Request.Context(), uint(taskID), uint(sid), uid, role)
	if err != nil {
		handleServiceError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"subtask": subtaskToJSON(st)})
}
