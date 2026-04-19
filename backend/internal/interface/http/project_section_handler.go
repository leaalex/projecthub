package handler

import (
	"net/http"
	"strconv"

	"task-manager/backend/internal/application"
	"task-manager/backend/internal/domain/project"

	"github.com/gin-gonic/gin"
)

type ProjectSectionHandler struct {
	Projects     *application.ProjectService
	SectionItems *application.SectionItemsReorderService
}

func sectionJSON(projectID uint, s *project.Section) gin.H {
	return gin.H{
		"id":         s.ID().Uint(),
		"project_id": projectID,
		"name":       s.Name(),
		"position":   s.Position(),
		"created_at": s.CreatedAt(),
		"updated_at": s.UpdatedAt(),
	}
}

type sectionCreateBody struct {
	Name string `json:"name" binding:"required"`
}

type sectionUpdateBody struct {
	Name string `json:"name" binding:"required"`
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
	sec, err := h.Projects.AddSection(c.Request.Context(), pid, body.Name)
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
	sec, err := h.Projects.RenameSection(c.Request.Context(), pid, uint(sectionIDRaw), body.Name)
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

type sectionItemsReorderBody struct {
	Items []application.SectionItemRef `json:"items" binding:"required,min=1,dive"`
}

// ReorderItems задаёт порядок задач и заметок внутри секции (sectionId=0 — без секции).
func (h *ProjectSectionHandler) ReorderItems(c *gin.Context) {
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
	var secPtr *uint
	if sectionIDRaw != 0 {
		v := uint(sectionIDRaw)
		secPtr = &v
	}
	var body sectionItemsReorderBody
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if h.SectionItems == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "section items reorder not configured"})
		return
	}
	if err := h.SectionItems.Reorder(c.Request.Context(), uid, role, application.SectionItemsReorderInput{
		ProjectID: pid,
		SectionID: secPtr,
		Items:     body.Items,
	}); err != nil {
		handleServiceError(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}
