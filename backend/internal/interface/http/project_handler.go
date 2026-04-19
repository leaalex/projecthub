package handler

import (
	"net/http"
	"strconv"

	"task-manager/backend/internal/application"
	"task-manager/backend/internal/domain/project"
	"task-manager/backend/internal/domain/user"

	"github.com/gin-gonic/gin"
)

// ProjectHandler — HTTP-обработчики проектов.
type ProjectHandler struct {
	Projects *application.ProjectService
	TaskSvc  *application.TaskService
	Deletion *application.ProjectDeletionService
}

type projectCreateBody struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
	Kind        string `json:"kind" binding:"omitempty,oneof=personal team"`
}

type projectBody struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
}

func projectJSON(p *project.Project, owner *user.User) gin.H {
	return gin.H{
		"id":          p.ID().Uint(),
		"name":        p.Name(),
		"description": p.Description(),
		"kind":        p.Kind().String(),
		"owner_id":    p.OwnerID().Uint(),
		"owner":       userPublic(owner),
		"created_at":  p.CreatedAt(),
		"updated_at":  p.UpdatedAt(),
	}
}

func (h *ProjectHandler) List(c *gin.Context) {
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
	list, owners, err := h.Projects.ListForCaller(c.Request.Context(), uid, role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	out := make([]gin.H, len(list))
	for i := range list {
		item := projectJSON(list[i], owners[i])
		item["caller_project_role"] = h.Projects.CallerProjectRoleString(c.Request.Context(), list[i].ID().Uint(), uid, role)
		out[i] = item
	}
	c.JSON(http.StatusOK, gin.H{"projects": out})
}

func (h *ProjectHandler) Create(c *gin.Context) {
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
	var body projectCreateBody
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}
	p, owner, err := h.Projects.Create(c.Request.Context(), uid, role, body.Name, body.Description, body.Kind)
	if err != nil {
		handleServiceError(c, err)
		return
	}
	out := projectJSON(p, owner)
	out["caller_project_role"] = h.Projects.CallerProjectRoleString(c.Request.Context(), p.ID().Uint(), uid, role)
	c.JSON(http.StatusCreated, gin.H{"project": out})
}

func (h *ProjectHandler) Get(c *gin.Context) {
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
	p, owner, err := h.Projects.Get(c.Request.Context(), uint(id), uid, role)
	if err != nil {
		handleServiceError(c, err)
		return
	}
	out := projectJSON(p, owner)
	out["caller_project_role"] = h.Projects.CallerProjectRoleString(c.Request.Context(), uint(id), uid, role)
	c.JSON(http.StatusOK, gin.H{"project": out})
}

func (h *ProjectHandler) Update(c *gin.Context) {
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
	var body projectBody
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}
	p, owner, err := h.Projects.Update(c.Request.Context(), uint(id), uid, role, body.Name, body.Description)
	if err != nil {
		handleServiceError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"project": projectJSON(p, owner)})
}

func (h *ProjectHandler) Delete(c *gin.Context) {
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
	if permanent {
		if h.Deletion == nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "deletion service not configured"})
			return
		}
		if err := h.Deletion.HardDelete(c.Request.Context(), uint(id), uid, role); err != nil {
			handleServiceError(c, err)
			return
		}
	} else {
		if err := h.Projects.Delete(c.Request.Context(), uint(id), uid, role); err != nil {
			handleServiceError(c, err)
			return
		}
	}
	c.Status(http.StatusNoContent)
}

// Restore снимает soft-delete с проекта.
func (h *ProjectHandler) Restore(c *gin.Context) {
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
	if h.Deletion == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "deletion service not configured"})
		return
	}
	if err := h.Deletion.Restore(c.Request.Context(), uint(id), uid, role); err != nil {
		handleServiceError(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *ProjectHandler) ListProjectTasks(c *gin.Context) {
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
	pid := uint(id)
	p, _, err := h.Projects.Get(c.Request.Context(), pid, uid, role)
	if err != nil {
		handleServiceError(c, err)
		return
	}
	tasks, err := h.TaskSvc.List(c.Request.Context(), uid, role, &pid, nil)
	if err != nil {
		handleServiceError(c, err)
		return
	}
	out := make([]gin.H, 0, len(tasks))
	ctx := c.Request.Context()
	projID := p.ID().Uint()
	for _, t := range tasks {
		acl, err := h.TaskSvc.CallerTaskACL(ctx, t, uid, role)
		if err != nil {
			handleServiceError(c, err)
			return
		}
		var sec *project.Section
		if sid := t.SectionID(); sid != nil {
			sec = p.SectionByID(*sid)
		}
		var assignee *user.User
		if h.TaskSvc.Users != nil && t.AssigneeID() != nil {
			assignee, _ = h.TaskSvc.Users.FindByID(ctx, *t.AssigneeID())
		}
		out = append(out, taskToJSON(t, sec, projID, assignee, acl))
	}
	c.JSON(http.StatusOK, gin.H{"tasks": out})
}
