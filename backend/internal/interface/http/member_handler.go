package handler

import (
	"net/http"
	"strconv"

	"task-manager/backend/internal/application"

	"github.com/gin-gonic/gin"
)

type MemberHandler struct {
	Projects *application.ProjectService
	Removal  *application.MemberRemovalService
}

func memberJSON(projectID uint, mw application.MemberWithUser) gin.H {
	m := mw.Member
	return gin.H{
		"id":         m.ID().Uint(),
		"project_id": projectID,
		"user_id":    m.UserID().Uint(),
		"role":       m.Role().String(),
		"user":       userPublic(mw.User),
		"created_at": m.CreatedAt(),
		"updated_at": m.UpdatedAt(),
	}
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
	if !h.Projects.CanAccessProject(c.Request.Context(), projectID, uid, role) {
		c.JSON(http.StatusForbidden, gin.H{"error": application.ErrForbidden.Error()})
		return
	}
	kind, err := h.Projects.ProjectKind(c.Request.Context(), projectID)
	if err != nil {
		handleServiceError(c, err)
		return
	}
	if kind.IsPersonal() {
		c.JSON(http.StatusOK, gin.H{"members": []gin.H{}})
		return
	}
	list, err := h.Projects.ListMembers(c.Request.Context(), projectID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	out := make([]gin.H, len(list))
	for i := range list {
		out[i] = memberJSON(projectID, list[i])
	}
	c.JSON(http.StatusOK, gin.H{"members": out})
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
	if !h.Projects.CanManageMembers(c.Request.Context(), projectID, uid, role) {
		c.JSON(http.StatusForbidden, gin.H{"error": application.ErrForbidden.Error()})
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
		targetUID, e = h.Projects.ResolveUserIDByEmail(c.Request.Context(), body.Email)
		if e != nil {
			handleServiceError(c, e)
			return
		}
	} else {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user_id or email required"})
		return
	}
	m, u, err := h.Projects.AddMember(c.Request.Context(), projectID, targetUID, body.Role)
	if err != nil {
		handleServiceError(c, err)
		return
	}
	c.JSON(http.StatusCreated, gin.H{"member": memberJSON(projectID, application.MemberWithUser{Member: m, User: u})})
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
	if !h.Projects.CanManageMembers(c.Request.Context(), projectID, uid, role) {
		c.JSON(http.StatusForbidden, gin.H{"error": application.ErrForbidden.Error()})
		return
	}
	var body updateMemberRoleBody
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}
	m, u, err := h.Projects.UpdateMemberRole(c.Request.Context(), projectID, uint(targetUID), body.Role)
	if err != nil {
		handleServiceError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"member": memberJSON(projectID, application.MemberWithUser{Member: m, User: u})})
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
	if !h.Projects.CanManageMembers(c.Request.Context(), projectID, uid, role) {
		c.JSON(http.StatusForbidden, gin.H{"error": application.ErrForbidden.Error()})
		return
	}

	var body application.TaskTransferRequest
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if body.TransferMode == application.TransferSingleUser && body.TransferToUserID == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "transfer_to_user_id required for single_user mode"})
		return
	}

	result, err := h.Removal.Remove(c.Request.Context(), projectID, uint(targetUID), body.TransferMode, body.TransferToUserID)
	if err != nil {
		handleServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, result)
}

func (h *MemberHandler) ApplyTaskTransfers(c *gin.Context) {
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
	if !h.Projects.CanManageMembers(c.Request.Context(), projectID, uid, role) {
		c.JSON(http.StatusForbidden, gin.H{"error": application.ErrForbidden.Error()})
		return
	}

	var body application.TaskTransferBatch
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result, err := h.Removal.ApplyManualTaskTransfers(c.Request.Context(), projectID, uint(targetUID), body.Transfers)
	if err != nil {
		handleServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, result)
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
	if err := h.Projects.TransferOwnership(c.Request.Context(), uint(pid), body.NewOwnerID, uid, role); err != nil {
		handleServiceError(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}
