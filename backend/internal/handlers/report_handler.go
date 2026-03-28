package handlers

import (
	"net/http"
	"strconv"

	"task-manager/backend/internal/services"

	"github.com/gin-gonic/gin"
)

type ReportHandler struct {
	Svc *services.ReportService
}

func (h *ReportHandler) Weekly(c *gin.Context) {
	uid, ok := ctxUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	rep, err := h.Svc.Weekly(uid)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, rep)
}

type generateBody struct {
	Title string `json:"title"`
}

func (h *ReportHandler) Generate(c *gin.Context) {
	_, ok := ctxUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	var body generateBody
	_ = c.ShouldBindJSON(&body)
	c.JSON(http.StatusAccepted, gin.H{
		"id":      1,
		"status":  "queued",
		"message": "Report generation is not implemented; use weekly JSON endpoint.",
	})
}

func (h *ReportHandler) PDF(c *gin.Context) {
	_, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "bad id"})
		return
	}
	c.JSON(http.StatusNotImplemented, gin.H{"error": "PDF export not implemented"})
}

func (h *ReportHandler) Excel(c *gin.Context) {
	_, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "bad id"})
		return
	}
	c.JSON(http.StatusNotImplemented, gin.H{"error": "Excel export not implemented"})
}
