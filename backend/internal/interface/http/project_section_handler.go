package handler

import (
	"context"
	"net/http"
	"strconv"

	"task-manager/backend/internal/application"
	"task-manager/backend/internal/domain/project"
	"task-manager/backend/internal/domain/task"
	"task-manager/backend/internal/domain/user"

	"github.com/gin-gonic/gin"
)

type ProjectSectionHandler struct {
	Projects *application.ProjectService
	ItemMove *application.SectionItemMoveService
	Tasks    *application.TaskService
	Users    user.Repository
}

func (h *ProjectSectionHandler) enrichAssignee(ctx context.Context, t *task.Task) *user.User {
	if h.Users == nil || t.AssigneeID() == nil {
		return nil
	}
	u, err := h.Users.FindByID(ctx, *t.AssigneeID())
	if err != nil {
		return nil
	}
	return u
}

func sectionJSON(projectID uint, s *project.Section) gin.H {
	return gin.H{
		"id":            s.ID().Uint(),
		"project_id":    projectID,
		"name":          s.Name(),
		"position":      s.Position(),
		"display_mode":  string(s.DisplayMode()),
		"created_at":    s.CreatedAt(),
		"updated_at":    s.UpdatedAt(),
	}
}

type sectionCreateBody struct {
	Name        string  `json:"name" binding:"required"`
	DisplayMode *string `json:"display_mode"`
}

type sectionUpdateBody struct {
	Name        string  `json:"name" binding:"required"`
	DisplayMode *string `json:"display_mode"`
}

type sectionReorderBody struct {
	SectionIDs []uint `json:"section_ids" binding:"required,min=1"`
}

func (h *ProjectSectionHandler) List(c *gin.Context) {
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
	pid := uint(projectIDRaw)
	if !h.Projects.CanAccessProject(c.Request.Context(), pid, uid, role) {
		handleServiceError(c, project.ErrForbidden)
		return
	}
	sections, err := h.Projects.ListSections(c.Request.Context(), pid)
	if err != nil {
		handleServiceError(c, err)
		return
	}
	out := make([]gin.H, len(sections))
	for i, s := range sections {
		out[i] = sectionJSON(pid, s)
	}
	c.JSON(http.StatusOK, gin.H{"sections": out})
}

func (h *ProjectSectionHandler) Create(c *gin.Context) {
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
	pid := uint(projectIDRaw)
	okManage, err := h.Projects.CanManageProjectTasks(c.Request.Context(), pid, uid, role)
	if err != nil {
		handleServiceError(c, err)
		return
	}
	if !okManage {
		handleServiceError(c, project.ErrForbidden)
		return
	}
	var body sectionCreateBody
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	dm := ""
	if body.DisplayMode != nil {
		dm = *body.DisplayMode
	}
	sec, err := h.Projects.AddSection(c.Request.Context(), pid, body.Name, dm)
	if err != nil {
		handleServiceError(c, err)
		return
	}
	c.JSON(http.StatusCreated, gin.H{"section": sectionJSON(pid, sec)})
}

func (h *ProjectSectionHandler) Update(c *gin.Context) {
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
	sectionIDRaw, err := strconv.ParseUint(c.Param("sectionId"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "bad section id"})
		return
	}
	pid := uint(projectIDRaw)
	okManage, err := h.Projects.CanManageProjectTasks(c.Request.Context(), pid, uid, role)
	if err != nil {
		handleServiceError(c, err)
		return
	}
	if !okManage {
		handleServiceError(c, project.ErrForbidden)
		return
	}
	var body sectionUpdateBody
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	sec, err := h.Projects.UpdateSection(c.Request.Context(), pid, uint(sectionIDRaw), body.Name, body.DisplayMode)
	if err != nil {
		handleServiceError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"section": sectionJSON(pid, sec)})
}

func (h *ProjectSectionHandler) Delete(c *gin.Context) {
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
	sectionIDRaw, err := strconv.ParseUint(c.Param("sectionId"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "bad section id"})
		return
	}
	pid := uint(projectIDRaw)
	okManage, err := h.Projects.CanManageProjectTasks(c.Request.Context(), pid, uid, role)
	if err != nil {
		handleServiceError(c, err)
		return
	}
	if !okManage {
		handleServiceError(c, project.ErrForbidden)
		return
	}
	if err := h.Projects.DeleteSection(c.Request.Context(), pid, uint(sectionIDRaw)); err != nil {
		handleServiceError(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *ProjectSectionHandler) Reorder(c *gin.Context) {
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
	pid := uint(projectIDRaw)
	okManage, err := h.Projects.CanManageProjectTasks(c.Request.Context(), pid, uid, role)
	if err != nil {
		handleServiceError(c, err)
		return
	}
	if !okManage {
		handleServiceError(c, project.ErrForbidden)
		return
	}
	var body sectionReorderBody
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.Projects.ReorderSections(c.Request.Context(), pid, body.SectionIDs); err != nil {
		handleServiceError(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}

type projectItemMoveBody struct {
	Kind      string `json:"kind" binding:"required"`
	ID        uint   `json:"id" binding:"required"`
	SectionID *uint  `json:"section_id"`
	BeforeID  *application.SectionItemRef `json:"before_id"`
	AfterID   *application.SectionItemRef `json:"after_id"`
}

// MoveItem перемещает задачу или заметку в секцию проекта с порядком между соседями (разрежённые position).
func (h *ProjectSectionHandler) MoveItem(c *gin.Context) {
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
	pid := uint(projectIDRaw)
	var body projectItemMoveBody
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if h.ItemMove == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "item move not configured"})
		return
	}
	res, err := h.ItemMove.Move(c.Request.Context(), uid, role, application.SectionItemMoveInput{
		ProjectID: pid,
		Kind:      body.Kind,
		ItemID:    body.ID,
		SectionID: body.SectionID,
		BeforeID:  body.BeforeID,
		AfterID:   body.AfterID,
	})
	if err != nil {
		handleServiceError(c, err)
		return
	}
	if res.Task != nil {
		if h.Tasks == nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "tasks service not configured"})
			return
		}
		acl, _ := h.Tasks.CallerTaskACL(c.Request.Context(), res.Task, uid, role)
		c.JSON(http.StatusOK, gin.H{"task": taskToJSON(res.Task, nil, 0, h.enrichAssignee(c.Request.Context(), res.Task), acl)})
		return
	}
	if res.Note != nil {
		c.JSON(http.StatusOK, gin.H{"note": noteToJSON(res.Note)})
		return
	}
	c.JSON(http.StatusInternalServerError, gin.H{"error": "empty move result"})
}
