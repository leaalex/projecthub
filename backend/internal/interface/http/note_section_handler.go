package handler

import (
	"net/http"
	"strconv"

	"task-manager/backend/internal/application"
	"task-manager/backend/internal/domain/project"

	"github.com/gin-gonic/gin"
)

// NoteSectionHandler — HTTP-обработчики секций заметок проекта.
// Права на изменение совпадают с секциями задач (CanManageProjectTasks): единая политика «структура проекта»
// (владелец и manager).
type NoteSectionHandler struct {
	Projects *application.ProjectService
}

func noteSectionJSON(projectID uint, s *project.NoteSection) gin.H {
	return gin.H{
		"id":         s.ID().Uint(),
		"project_id": projectID,
		"name":       s.Name(),
		"position":   s.Position(),
		"created_at": s.CreatedAt(),
		"updated_at": s.UpdatedAt(),
	}
}

type noteSectionCreateBody struct {
	Name string `json:"name" binding:"required"`
}

type noteSectionUpdateBody struct {
	Name string `json:"name" binding:"required"`
}

type noteSectionReorderBody struct {
	SectionIDs []uint `json:"section_ids" binding:"required,min=1"`
}

func (h *NoteSectionHandler) List(c *gin.Context) {
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
	sections, err := h.Projects.ListNoteSections(c.Request.Context(), pid)
	if err != nil {
		handleServiceError(c, err)
		return
	}
	out := make([]gin.H, len(sections))
	for i, s := range sections {
		out[i] = noteSectionJSON(pid, s)
	}
	c.JSON(http.StatusOK, gin.H{"sections": out})
}

func (h *NoteSectionHandler) Create(c *gin.Context) {
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
	var body noteSectionCreateBody
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	sec, err := h.Projects.AddNoteSection(c.Request.Context(), pid, body.Name)
	if err != nil {
		handleServiceError(c, err)
		return
	}
	c.JSON(http.StatusCreated, gin.H{"section": noteSectionJSON(pid, sec)})
}

func (h *NoteSectionHandler) Update(c *gin.Context) {
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
	var body noteSectionUpdateBody
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	sec, err := h.Projects.RenameNoteSection(c.Request.Context(), pid, uint(sectionIDRaw), body.Name)
	if err != nil {
		handleServiceError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"section": noteSectionJSON(pid, sec)})
}

func (h *NoteSectionHandler) Delete(c *gin.Context) {
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
	if err := h.Projects.DeleteNoteSection(c.Request.Context(), pid, uint(sectionIDRaw)); err != nil {
		handleServiceError(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *NoteSectionHandler) Reorder(c *gin.Context) {
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
	var body noteSectionReorderBody
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.Projects.ReorderNoteSections(c.Request.Context(), pid, body.SectionIDs); err != nil {
		handleServiceError(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}
