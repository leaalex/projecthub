package handlers

import (
	"net/http"
	"strconv"

	"task-manager/backend/internal/models"
	"task-manager/backend/internal/services"

	"github.com/gin-gonic/gin"
)

type ProjectHandler struct {
	Svc     *services.ProjectService
	Members *services.ProjectMemberService
	TaskSvc *services.TaskService
}

type projectBody struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
}

type projectCreateBody struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
	Kind        string `json:"kind" binding:"omitempty,oneof=personal team"`
}

type projectWithCallerRole struct {
	models.Project
	CallerProjectRole string `json:"caller_project_role,omitempty"`
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
	list, err := h.Svc.ListForCaller(uid, role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if h.Members != nil {
		out := make([]projectWithCallerRole, len(list))
		for i := range list {
			out[i] = projectWithCallerRole{
				Project:           list[i],
				CallerProjectRole: h.Members.CallerProjectRoleString(list[i].ID, uid, role),
			}
		}
		c.JSON(http.StatusOK, gin.H{"projects": out})
		return
	}
	c.JSON(http.StatusOK, gin.H{"projects": list})
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
	p, err := h.Svc.Create(uid, role, body.Name, body.Description, models.ProjectKind(body.Kind))
	if err != nil {
		if err == services.ErrTeamProjectNotAllowed {
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
			return
		}
		if err == services.ErrInvalidInput {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	out := gin.H{"project": p}
	if h.Members != nil {
		out["caller_project_role"] = h.Members.CallerProjectRoleString(p.ID, uid, role)
	}
	c.JSON(http.StatusCreated, out)
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
	p, err := h.Svc.Get(uint(id), uid, role)
	if err != nil {
		if err == services.ErrProjectNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		if err == services.ErrForbidden {
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	out := gin.H{"project": p}
	if h.Members != nil {
		out["caller_project_role"] = h.Members.CallerProjectRoleString(uint(id), uid, role)
	}
	c.JSON(http.StatusOK, out)
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
	p, err := h.Svc.Update(uint(id), uid, role, body.Name, body.Description)
	if err != nil {
		if err == services.ErrProjectNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		if err == services.ErrForbidden {
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
			return
		}
		if err == services.ErrInvalidInput {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"project": p})
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
	if err := h.Svc.Delete(uint(id), uid, role); err != nil {
		if err == services.ErrProjectNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		if err == services.ErrForbidden {
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *ProjectHandler) Tasks(c *gin.Context) {
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
	tasks, err := h.Svc.TasksForProject(uint(id), uid, role)
	if err != nil {
		if err == services.ErrProjectNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		if err == services.ErrForbidden {
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if h.TaskSvc != nil {
		_ = h.TaskSvc.AttachCallerACLBatch(tasks, uid, role)
	}
	c.JSON(http.StatusOK, gin.H{"tasks": tasks})
}
