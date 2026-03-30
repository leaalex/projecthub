package handlers

import (
	"net/http"
	"strconv"

	"task-manager/backend/internal/models"
	"task-manager/backend/internal/services"

	"github.com/gin-gonic/gin"
)

type MemberHandler struct {
	Svc *services.ProjectMemberService
}

func (h *MemberHandler) List(c *gin.Context) {
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
	pid, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "bad id"})
		return
	}
	projectID := uint(pid)
	if !h.Svc.CanAccessProject(projectID, uid, role) {
		c.JSON(http.StatusForbidden, gin.H{"error": services.ErrForbidden.Error()})
		return
	}
	list, err := h.Svc.List(projectID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"members": list})
}

type addMemberBody struct {
	UserID *uint  `json:"user_id"`
	Email  string `json:"email"`
	Role   string `json:"role" binding:"required"`
}

func (h *MemberHandler) Add(c *gin.Context) {
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
	pid, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "bad id"})
		return
	}
	projectID := uint(pid)
	if !h.Svc.CanManageMembers(projectID, uid, role) {
		c.JSON(http.StatusForbidden, gin.H{"error": services.ErrForbidden.Error()})
		return
	}
	var body addMemberBody
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}
	var targetUID uint
	if body.UserID != nil && *body.UserID > 0 {
		targetUID = *body.UserID
	} else if body.Email != "" {
		var e error
		targetUID, e = h.Svc.ResolveUserIDByEmail(body.Email)
		if e != nil {
			handleServiceError(c, e)
			return
		}
	} else {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user_id or email required"})
		return
	}
	pr := models.ProjectRole(body.Role)
	pm, err := h.Svc.Add(projectID, targetUID, pr)
	if err != nil {
		handleServiceError(c, err)
		return
	}
	c.JSON(http.StatusCreated, gin.H{"member": pm})
}

type updateMemberRoleBody struct {
	Role string `json:"role" binding:"required"`
}

func (h *MemberHandler) UpdateRole(c *gin.Context) {
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
	pid, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "bad project id"})
		return
	}
	targetUID, err := strconv.ParseUint(c.Param("user_id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "bad user id"})
		return
	}
	projectID := uint(pid)
	if !h.Svc.CanManageMembers(projectID, uid, role) {
		c.JSON(http.StatusForbidden, gin.H{"error": services.ErrForbidden.Error()})
		return
	}
	var body updateMemberRoleBody
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}
	pr := models.ProjectRole(body.Role)
	pm, err := h.Svc.UpdateRole(projectID, uint(targetUID), pr)
	if err != nil {
		handleServiceError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"member": pm})
}

func (h *MemberHandler) Remove(c *gin.Context) {
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
	pid, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "bad project id"})
		return
	}
	targetUID, err := strconv.ParseUint(c.Param("user_id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "bad user id"})
		return
	}
	projectID := uint(pid)
	if !h.Svc.CanManageMembers(projectID, uid, role) {
		c.JSON(http.StatusForbidden, gin.H{"error": services.ErrForbidden.Error()})
		return
	}
	if err := h.Svc.Remove(projectID, uint(targetUID)); err != nil {
		handleServiceError(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}

type transferOwnerBody struct {
	NewOwnerID uint `json:"new_owner_id" binding:"required"`
}

func (h *MemberHandler) TransferOwnership(c *gin.Context) {
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
	pid, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "bad id"})
		return
	}
	var body transferOwnerBody
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}
	if err := h.Svc.TransferOwnership(uint(pid), body.NewOwnerID, uid, role); err != nil {
		handleServiceError(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}
