package handlers

import (
	"fmt"
	"net/http"
	"path/filepath"
	"strings"

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

func (h *ReportHandler) Generate(c *gin.Context) {
	callerID, ok := ctxUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	role, _ := ctxRole(c)

	var req services.GenerateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}

	data, filename, contentType, err := h.Svc.Generate(callerID, role, req)
	if err != nil {
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

	safe := strings.Map(func(r rune) rune {
		if (r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z') || (r >= '0' && r <= '9') || r == '-' || r == '_' || r == '.' {
			return r
		}
		return '_'
	}, filepath.Base(filename))
	if safe == "" || safe == "." {
		safe = "report.bin"
	}

	c.Header("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, safe))
	c.Data(http.StatusOK, contentType, data)
}
