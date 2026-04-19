package handler

import (
	"fmt"
	"net/http"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"task-manager/backend/internal/application"
	"task-manager/backend/internal/domain/report"
	"task-manager/backend/internal/domain/task"

	"github.com/gin-gonic/gin"
)

// ReportHandler — отчёты и сохранённые экспорты.
type ReportHandler struct {
	Svc *application.ReportingService
}

type generateRequestDTO struct {
	Format     string   `json:"format"`
	DateFrom   *string  `json:"date_from"`
	DateTo     *string  `json:"date_to"`
	ProjectIDs []uint   `json:"project_ids"`
	UserIDs    []uint   `json:"user_ids"`
	Statuses   []string `json:"statuses"`
	Priorities []string `json:"priorities"`
	Fields     []string `json:"fields"`
	GroupBy    string   `json:"group_by"`
	PdfLayout  string   `json:"pdf_layout"`
}

func parseReportDateStart(s string) (time.Time, error) {
	s = strings.TrimSpace(s)
	if s == "" {
		return time.Time{}, fmt.Errorf("empty date")
	}
	t, err := time.Parse("2006-01-02", s)
	if err != nil {
		return time.Time{}, err
	}
	return time.Date(t.Year(), t.Month(), t.Day(), 0, 0, 0, 0, time.UTC), nil
}

func dtoToGenerateParams(d generateRequestDTO) (report.GenerateParams, error) {
	format, err := report.ParseFormat(d.Format)
	if err != nil {
		return report.GenerateParams{}, err
	}
	groupBy, err := report.ParseGroupBy(d.GroupBy)
	if err != nil {
		return report.GenerateParams{}, err
	}
	layout, err := report.ParsePDFLayout(d.PdfLayout)
	if err != nil {
		layout = report.PDFLayoutTable
	}
	p := report.GenerateParams{
		Format:     format,
		ProjectIDs: d.ProjectIDs,
		UserIDs:    d.UserIDs,
		Fields:     d.Fields,
		GroupBy:    groupBy,
		PDFLayout:  layout,
	}
	for _, x := range d.Statuses {
		st, err := task.ParseStatus(x)
		if err != nil {
			return report.GenerateParams{}, report.ErrInvalidFields
		}
		p.Statuses = append(p.Statuses, st)
	}
	for _, x := range d.Priorities {
		pr, err := task.ParsePriority(x)
		if err != nil {
			return report.GenerateParams{}, report.ErrInvalidFields
		}
		p.Priorities = append(p.Priorities, pr)
	}
	if d.DateFrom != nil && strings.TrimSpace(*d.DateFrom) != "" {
		from, err := parseReportDateStart(*d.DateFrom)
		if err != nil {
			return report.GenerateParams{}, application.ErrInvalidInput
		}
		p.DateFrom = &from
	}
	if d.DateTo != nil && strings.TrimSpace(*d.DateTo) != "" {
		to, err := parseReportDateStart(*d.DateTo)
		if err != nil {
			return report.GenerateParams{}, application.ErrInvalidInput
		}
		endExclusive := to.AddDate(0, 0, 1)
		p.DateTo = &endExclusive
	}
	return p, nil
}

func (h *ReportHandler) Weekly(c *gin.Context) {
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
	rep, err := h.Svc.Weekly(c.Request.Context(), uid, role)
	if err != nil {
		handleServiceError(c, err)
		return
	}
	c.JSON(http.StatusOK, rep)
}

func (h *ReportHandler) ListExports(c *gin.Context) {
	callerID, ok := ctxUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	role, _ := ctxRole(c)
	list, err := h.Svc.List(c.Request.Context(), callerID, role)
	if err != nil {
		handleServiceError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"reports": list})
}

func (h *ReportHandler) DownloadExport(c *gin.Context) {
	callerID, ok := ctxUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	role, _ := ctxRole(c)

	n, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil || n == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "bad id"})
		return
	}
	id := uint(n)

	rec, fullPath, err := h.Svc.FilePath(c.Request.Context(), id, callerID, role)
	if err != nil {
		handleServiceError(c, err)
		return
	}

	safe := strings.Map(func(r rune) rune {
		if (r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z') || (r >= '0' && r <= '9') || r == '-' || r == '_' || r == '.' {
			return r
		}
		return '_'
	}, filepath.Base(rec.DisplayName))
	if safe == "" || safe == "." {
		safe = "report." + rec.Format
	}

	c.Header("Content-Type", application.FormatMIME(strings.ToLower(rec.Format)))
	c.Header("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, safe))
	c.File(fullPath)
}

func (h *ReportHandler) DeleteExport(c *gin.Context) {
	callerID, ok := ctxUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	role, _ := ctxRole(c)

	n, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil || n == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "bad id"})
		return
	}
	id := uint(n)

	if err := h.Svc.Delete(c.Request.Context(), id, callerID, role); err != nil {
		handleServiceError(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *ReportHandler) Generate(c *gin.Context) {
	callerID, ok := ctxUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	role, _ := ctxRole(c)

	var dto generateRequestDTO
	if err := c.ShouldBindJSON(&dto); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}

	params, err := dtoToGenerateParams(dto)
	if err != nil {
		handleServiceError(c, err)
		return
	}

	rec, err := h.Svc.Generate(c.Request.Context(), callerID, role, params)
	if err != nil {
		handleServiceError(c, err)
		return
	}

	c.JSON(http.StatusCreated, gin.H{"report": rec})
}
