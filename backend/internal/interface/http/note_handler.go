package handler

import (
	"net/http"
	"strconv"

	"task-manager/backend/internal/application"
	"task-manager/backend/internal/domain/note"
	"task-manager/backend/internal/domain/user"

	"github.com/gin-gonic/gin"
)

// NoteHandler — HTTP-обработчики заметок.
type NoteHandler struct {
	Notes *application.NoteService
}

type noteCreateBody struct {
	Title     string `json:"title" binding:"required"`
	Body      string `json:"body"`
	SectionID *uint  `json:"section_id"`
}

type noteUpdateBody struct {
	Title *string `json:"title"`
	Body  *string `json:"body"`
}

type noteMoveBody struct {
	SectionID *uint `json:"section_id"`
	Position  int   `json:"position"`
}

type noteLinkBody struct {
	TaskID uint `json:"task_id" binding:"required"`
}

// getNoteInProject загружает заметку с ACL и проверяет, что она принадлежит projectID из пути.
// При несовпадении project_id возвращает note.ErrNoteNotFound (404), чтобы не раскрывать существование заметки в другом проекте.
func (h *NoteHandler) getNoteInProject(c *gin.Context, projectID uint, noteID uint, uid uint, role user.Role) (*note.Note, error) {
	n, err := h.Notes.Get(c.Request.Context(), noteID, uid, role)
	if err != nil {
		return nil, err
	}
	if n.ProjectID().Uint() != projectID {
		return nil, note.ErrNoteNotFound
	}
	return n, nil
}

func noteToJSON(n *note.Note) gin.H {
	var secID *uint
	if sid := n.SectionID(); sid != nil {
		v := sid.Uint()
		secID = &v
	}
	return gin.H{
		"id":         n.ID().Uint(),
		"project_id": n.ProjectID().Uint(),
		"section_id": secID,
		"author_id":  n.AuthorID().Uint(),
		"title":      n.Title(),
		"body":       n.Body(),
		"position":   n.Position(),
		"created_at": n.CreatedAt(),
		"updated_at": n.UpdatedAt(),
	}
}

func (h *NoteHandler) List(c *gin.Context) {
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
	notes, err := h.Notes.List(c.Request.Context(), uint(projectID), uid, role)
	if err != nil {
		handleServiceError(c, err)
		return
	}
	out := make([]gin.H, 0, len(notes))
	for _, n := range notes {
		out = append(out, noteToJSON(n))
	}
	c.JSON(http.StatusOK, gin.H{"notes": out})
}

// ListAll возвращает живые заметки по всем проектам, видимым пользователю (GET /notes).
// Query: project_id — опционально ограничить одним проектом (если нет доступа — пустой список).
func (h *NoteHandler) ListAll(c *gin.Context) {
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
	notes, err := h.Notes.ListVisible(c.Request.Context(), uid, role, projectID)
	if err != nil {
		handleServiceError(c, err)
		return
	}
	out := make([]gin.H, 0, len(notes))
	for _, n := range notes {
		out = append(out, noteToJSON(n))
	}
	c.JSON(http.StatusOK, gin.H{"notes": out})
}

func (h *NoteHandler) Create(c *gin.Context) {
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
	var body noteCreateBody
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	n, err := h.Notes.Create(c.Request.Context(), uid, role, application.NoteCreate{
		ProjectID: uint(projectID),
		SectionID: body.SectionID,
		Title:     body.Title,
		Body:      body.Body,
	})
	if err != nil {
		handleServiceError(c, err)
		return
	}
	c.JSON(http.StatusCreated, gin.H{"note": noteToJSON(n)})
}

func (h *NoteHandler) Get(c *gin.Context) {
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
	noteID, err := strconv.ParseUint(c.Param("noteId"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "bad note id"})
		return
	}
	n, err := h.getNoteInProject(c, uint(projectID), uint(noteID), uid, role)
	if err != nil {
		handleServiceError(c, err)
		return
	}
	// Enrich with linked task IDs.
	taskIDs, err := h.Notes.ListLinks(c.Request.Context(), uint(noteID), uid, role)
	if err != nil {
		handleServiceError(c, err)
		return
	}
	ids := make([]uint, len(taskIDs))
	for i, tid := range taskIDs {
		ids[i] = tid.Uint()
	}
	out := noteToJSON(n)
	out["linked_task_ids"] = ids
	c.JSON(http.StatusOK, gin.H{"note": out})
}

func (h *NoteHandler) Update(c *gin.Context) {
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
	noteID, err := strconv.ParseUint(c.Param("noteId"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "bad note id"})
		return
	}
	if _, err := h.getNoteInProject(c, uint(projectID), uint(noteID), uid, role); err != nil {
		handleServiceError(c, err)
		return
	}
	var body noteUpdateBody
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	n, err := h.Notes.Update(c.Request.Context(), uint(noteID), uid, role, application.NoteUpdate{
		Title: body.Title,
		Body:  body.Body,
	})
	if err != nil {
		handleServiceError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"note": noteToJSON(n)})
}

func (h *NoteHandler) Delete(c *gin.Context) {
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
	noteID, err := strconv.ParseUint(c.Param("noteId"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "bad note id"})
		return
	}
	permanent := c.DefaultQuery("permanent", "false") == "true"
	if permanent {
		if err := h.Notes.HardDeleteInProject(c.Request.Context(), uint(projectID), uint(noteID), uid, role); err != nil {
			handleServiceError(c, err)
			return
		}
	} else {
		if _, err := h.getNoteInProject(c, uint(projectID), uint(noteID), uid, role); err != nil {
			handleServiceError(c, err)
			return
		}
		if err := h.Notes.SoftDelete(c.Request.Context(), uint(noteID), uid, role); err != nil {
			handleServiceError(c, err)
			return
		}
	}
	c.Status(http.StatusNoContent)
}

func (h *NoteHandler) Restore(c *gin.Context) {
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
	noteID, err := strconv.ParseUint(c.Param("noteId"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "bad note id"})
		return
	}
	if err := h.Notes.RestoreInProject(c.Request.Context(), uint(projectID), uint(noteID), uid, role); err != nil {
		handleServiceError(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *NoteHandler) Move(c *gin.Context) {
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
	noteID, err := strconv.ParseUint(c.Param("noteId"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "bad note id"})
		return
	}
	if _, err := h.getNoteInProject(c, uint(projectID), uint(noteID), uid, role); err != nil {
		handleServiceError(c, err)
		return
	}
	var body noteMoveBody
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	n, err := h.Notes.Move(c.Request.Context(), uint(noteID), uid, role, body.SectionID, body.Position)
	if err != nil {
		handleServiceError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"note": noteToJSON(n)})
}

func (h *NoteHandler) LinkTask(c *gin.Context) {
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
	noteID, err := strconv.ParseUint(c.Param("noteId"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "bad note id"})
		return
	}
	if _, err := h.getNoteInProject(c, uint(projectID), uint(noteID), uid, role); err != nil {
		handleServiceError(c, err)
		return
	}
	var body noteLinkBody
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.Notes.LinkTask(c.Request.Context(), uint(noteID), body.TaskID, uid, role); err != nil {
		handleServiceError(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *NoteHandler) UnlinkTask(c *gin.Context) {
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
	noteID, err := strconv.ParseUint(c.Param("noteId"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "bad note id"})
		return
	}
	if _, err := h.getNoteInProject(c, uint(projectID), uint(noteID), uid, role); err != nil {
		handleServiceError(c, err)
		return
	}
	taskID, err := strconv.ParseUint(c.Param("taskId"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "bad task id"})
		return
	}
	if err := h.Notes.UnlinkTask(c.Request.Context(), uint(noteID), uint(taskID), uid, role); err != nil {
		handleServiceError(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *NoteHandler) ListLinkedNotesByTask(c *gin.Context) {
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
		c.JSON(http.StatusBadRequest, gin.H{"error": "bad task id"})
		return
	}
	notes, err := h.Notes.ListLinkedNotes(c.Request.Context(), uint(taskID), uid, role)
	if err != nil {
		handleServiceError(c, err)
		return
	}
	out := make([]gin.H, 0, len(notes))
	for _, n := range notes {
		out = append(out, noteToJSON(n))
	}
	c.JSON(http.StatusOK, gin.H{"notes": out})
}
