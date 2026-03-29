package services

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"time"

	"task-manager/backend/internal/models"

	"gorm.io/gorm"
)

// GenerateRequest configures custom task report export (JSON body).
type GenerateRequest struct {
	Format      string   `json:"format"`
	DateFrom    *string  `json:"date_from"`
	DateTo      *string  `json:"date_to"`
	ProjectIDs  []uint   `json:"project_ids"`
	UserIDs     []uint   `json:"user_ids"`
	Statuses    []string `json:"statuses"`
	Priorities  []string `json:"priorities"`
	Fields      []string `json:"fields"`
	GroupBy     string   `json:"group_by"`
	// PdfLayout: "table" (default) or "list" — only used when format is pdf.
	PdfLayout string `json:"pdf_layout"`
}

// ErrSavedReportNotFound is returned when a saved export id does not exist.
var ErrSavedReportNotFound = errors.New("saved report not found")

type ReportService struct {
	DB         *gorm.DB
	ReportsDir string
}

type WeeklyReport struct {
	WeekStart       string         `json:"week_start"`
	WeekEnd         string         `json:"week_end"`
	TotalTasks      int64          `json:"total_tasks"`
	ByStatus        map[string]int `json:"by_status"`
	CompletedInWeek int64          `json:"completed_in_week"`
	ProjectsCount   int64          `json:"projects_count"`
}

func (s *ReportService) Weekly(userID uint, role models.Role) (*WeeklyReport, error) {
	now := time.Now().UTC()
	weekday := int(now.Weekday())
	if weekday == 0 {
		weekday = 7
	}
	start := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC).AddDate(0, 0, -(weekday - 1))
	end := start.AddDate(0, 0, 7)

	var base *gorm.DB
	if models.IsSystemRole(role) {
		base = s.DB.Model(&models.Task{})
	} else {
		ownedIDs, err := (&TaskService{DB: s.DB}).ownedProjectIDs(userID)
		if err != nil {
			return nil, err
		}
		base = s.DB.Model(&models.Task{})
		if len(ownedIDs) > 0 {
			base = base.Where("project_id IN ? OR assignee_id = ?", ownedIDs, userID)
		} else {
			base = base.Where("assignee_id = ?", userID)
		}
	}

	var total int64
	if err := base.Session(&gorm.Session{}).Count(&total).Error; err != nil {
		return nil, err
	}

	var byStatus []struct {
		Status string
		Cnt    int
	}
	q := s.DB.Model(&models.Task{})
	if models.IsSystemRole(role) {
		// all tasks
	} else {
		ownedIDs, err := (&TaskService{DB: s.DB}).ownedProjectIDs(userID)
		if err != nil {
			return nil, err
		}
		if len(ownedIDs) > 0 {
			q = q.Where("project_id IN ? OR assignee_id = ?", ownedIDs, userID)
		} else {
			q = q.Where("assignee_id = ?", userID)
		}
	}
	if err := q.Select("status, count(*) as cnt").Group("status").Scan(&byStatus).Error; err != nil {
		return nil, err
	}
	m := make(map[string]int)
	for _, r := range byStatus {
		m[r.Status] = r.Cnt
	}

	var completed int64
	q2 := s.DB.Model(&models.Task{}).Where("status = ?", models.StatusDone)
	if models.IsSystemRole(role) {
		// all tasks
	} else {
		ownedIDs, err := (&TaskService{DB: s.DB}).ownedProjectIDs(userID)
		if err != nil {
			return nil, err
		}
		if len(ownedIDs) > 0 {
			q2 = q2.Where("project_id IN ? OR assignee_id = ?", ownedIDs, userID)
		} else {
			q2 = q2.Where("assignee_id = ?", userID)
		}
	}
	q2 = q2.Where("updated_at >= ? AND updated_at < ?", start, end)
	if err := q2.Count(&completed).Error; err != nil {
		return nil, err
	}

	var pc int64
	if models.IsSystemRole(role) {
		_ = s.DB.Model(&models.Project{}).Count(&pc).Error
	} else {
		_ = s.DB.Model(&models.Project{}).Where("owner_id = ?", userID).Count(&pc).Error
	}

	return &WeeklyReport{
		WeekStart:       start.Format(time.RFC3339),
		WeekEnd:         end.Format(time.RFC3339),
		TotalTasks:      total,
		ByStatus:        m,
		CompletedInWeek: completed,
		ProjectsCount:   pc,
	}, nil
}

func parseReportDateStart(s string) (time.Time, error) {
	s = strings.TrimSpace(s)
	if s == "" {
		return time.Time{}, ErrInvalidInput
	}
	t, err := time.Parse("2006-01-02", s)
	if err != nil {
		return time.Time{}, ErrInvalidInput
	}
	return time.Date(t.Year(), t.Month(), t.Day(), 0, 0, 0, 0, time.UTC), nil
}

// generateReportBytes builds report file bytes (query + export).
func (s *ReportService) generateReportBytes(callerID uint, role models.Role, req GenerateRequest) ([]byte, string, string, error) {
	format := strings.ToLower(strings.TrimSpace(req.Format))
	if format != "csv" && format != "xlsx" && format != "pdf" && format != "txt" {
		return nil, "", "", ErrInvalidInput
	}

	groupBy := strings.TrimSpace(strings.ToLower(req.GroupBy))
	switch groupBy {
	case "", "project", "status", "priority", "assignee":
	default:
		return nil, "", "", ErrInvalidInput
	}

	if !models.IsSystemRole(role) && len(req.UserIDs) > 0 {
		return nil, "", "", ErrForbidden
	}

	q := s.DB.Model(&models.Task{}).Preload("Project").Preload("Assignee")
	taskSvc := &TaskService{DB: s.DB}

	if models.IsSystemRole(role) && len(req.UserIDs) > 0 {
		q = q.Joins("LEFT JOIN projects AS rep_proj ON rep_proj.id = tasks.project_id").
			Where("(tasks.assignee_id IN ?) OR (rep_proj.owner_id IN ?)", req.UserIDs, req.UserIDs)
	} else if !models.IsSystemRole(role) {
		owned, err := taskSvc.ownedProjectIDs(callerID)
		if err != nil {
			return nil, "", "", err
		}
		if len(owned) > 0 {
			q = q.Where("tasks.project_id IN ? OR tasks.assignee_id = ?", owned, callerID)
		} else {
			q = q.Where("tasks.assignee_id = ?", callerID)
		}
	}

	if len(req.ProjectIDs) > 0 {
		q = q.Where("tasks.project_id IN ?", req.ProjectIDs)
	}

	if len(req.Statuses) > 0 {
		st := make([]models.TaskStatus, 0, len(req.Statuses))
		for _, x := range req.Statuses {
			st = append(st, models.TaskStatus(strings.TrimSpace(x)))
		}
		q = q.Where("tasks.status IN ?", st)
	}

	if len(req.Priorities) > 0 {
		pr := make([]models.TaskPriority, 0, len(req.Priorities))
		for _, x := range req.Priorities {
			pr = append(pr, models.TaskPriority(strings.TrimSpace(x)))
		}
		q = q.Where("tasks.priority IN ?", pr)
	}

	if req.DateFrom != nil && strings.TrimSpace(*req.DateFrom) != "" {
		from, err := parseReportDateStart(*req.DateFrom)
		if err != nil {
			return nil, "", "", err
		}
		q = q.Where("tasks.created_at >= ?", from)
	}
	if req.DateTo != nil && strings.TrimSpace(*req.DateTo) != "" {
		to, err := parseReportDateStart(*req.DateTo)
		if err != nil {
			return nil, "", "", err
		}
		endExclusive := to.AddDate(0, 0, 1)
		q = q.Where("tasks.created_at < ?", endExclusive)
	}

	var tasks []models.Task
	if err := q.Order("tasks.id asc").Find(&tasks).Error; err != nil {
		return nil, "", "", err
	}

	pdfLayout := strings.ToLower(strings.TrimSpace(req.PdfLayout))
	if pdfLayout == "" {
		pdfLayout = "table"
	}
	if pdfLayout != "table" && pdfLayout != "list" {
		pdfLayout = "table"
	}

	return BuildReportFile(format, tasks, req.Fields, groupBy, pdfLayout)
}

func randomStorageKey(ext string) (string, error) {
	var b [16]byte
	if _, err := io.ReadFull(rand.Reader, b[:]); err != nil {
		return "", err
	}
	return hex.EncodeToString(b[:]) + ext, nil
}

func reportFormatExt(format string) string {
	switch format {
	case "csv":
		return ".csv"
	case "xlsx":
		return ".xlsx"
	case "pdf":
		return ".pdf"
	case "txt":
		return ".txt"
	default:
		return ".bin"
	}
}

// ReportMIME returns Content-Type for a saved report format.
func ReportMIME(format string) string {
	switch strings.ToLower(format) {
	case "csv":
		return "text/csv; charset=utf-8"
	case "xlsx":
		return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
	case "pdf":
		return "application/pdf"
	case "txt":
		return "text/plain; charset=utf-8"
	default:
		return "application/octet-stream"
	}
}

// GenerateAndSave writes the report to ReportsDir and persists metadata.
func (s *ReportService) GenerateAndSave(callerID uint, role models.Role, req GenerateRequest) (*models.SavedReport, error) {
	if s.ReportsDir == "" {
		return nil, fmt.Errorf("reports directory not configured")
	}
	if err := os.MkdirAll(s.ReportsDir, 0o755); err != nil {
		return nil, err
	}

	data, displayName, _, err := s.generateReportBytes(callerID, role, req)
	if err != nil {
		return nil, err
	}

	format := strings.ToLower(strings.TrimSpace(req.Format))
	ext := reportFormatExt(format)
	storageKey, err := randomStorageKey(ext)
	if err != nil {
		return nil, err
	}

	fullPath := filepath.Join(s.ReportsDir, storageKey)
	if err := os.WriteFile(fullPath, data, 0o644); err != nil {
		return nil, err
	}

	filtersJSON, _ := json.Marshal(req)

	rec := models.SavedReport{
		UserID:      callerID,
		StorageKey:  storageKey,
		DisplayName: filepath.Base(displayName),
		Format:      format,
		SizeBytes:   int64(len(data)),
		FiltersJSON: string(filtersJSON),
	}
	if err := s.DB.Create(&rec).Error; err != nil {
		_ = os.Remove(fullPath)
		return nil, err
	}
	return &rec, nil
}

// ListSaved returns saved exports for the caller; admins see all.
func (s *ReportService) ListSaved(callerID uint, role models.Role) ([]models.SavedReport, error) {
	var list []models.SavedReport
	q := s.DB.Model(&models.SavedReport{}).Order("created_at desc")
	if !models.IsSystemRole(role) {
		q = q.Where("user_id = ?", callerID)
	}
	if err := q.Find(&list).Error; err != nil {
		return nil, err
	}
	return list, nil
}

// SavedReportFilePath returns the on-disk path after ACL check; verifies file exists.
func (s *ReportService) SavedReportFilePath(id, callerID uint, role models.Role) (*models.SavedReport, string, error) {
	var r models.SavedReport
	if err := s.DB.First(&r, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, "", ErrSavedReportNotFound
		}
		return nil, "", err
	}
	if !models.IsSystemRole(role) && r.UserID != callerID {
		return nil, "", ErrForbidden
	}
	full := filepath.Join(s.ReportsDir, r.StorageKey)
	if _, err := os.Stat(full); err != nil {
		if os.IsNotExist(err) {
			return nil, "", ErrSavedReportNotFound
		}
		return nil, "", err
	}
	return &r, full, nil
}

// DeleteSaved removes a saved export row and its file after the same ACL as download.
func (s *ReportService) DeleteSaved(id, callerID uint, role models.Role) error {
	var r models.SavedReport
	if err := s.DB.First(&r, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrSavedReportNotFound
		}
		return err
	}
	if !models.IsSystemRole(role) && r.UserID != callerID {
		return ErrForbidden
	}
	full := filepath.Join(s.ReportsDir, r.StorageKey)
	_ = os.Remove(full)
	if err := s.DB.Delete(&models.SavedReport{}, id).Error; err != nil {
		return err
	}
	return nil
}
