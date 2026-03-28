package services

import (
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
}

type ReportService struct {
	DB *gorm.DB
}

type WeeklyReport struct {
	WeekStart       string         `json:"week_start"`
	WeekEnd         string         `json:"week_end"`
	TotalTasks      int64          `json:"total_tasks"`
	ByStatus        map[string]int `json:"by_status"`
	CompletedInWeek int64          `json:"completed_in_week"`
	ProjectsCount   int64          `json:"projects_count"`
}

func (s *ReportService) Weekly(userID uint) (*WeeklyReport, error) {
	now := time.Now().UTC()
	weekday := int(now.Weekday())
	if weekday == 0 {
		weekday = 7
	}
	start := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC).AddDate(0, 0, -(weekday - 1))
	end := start.AddDate(0, 0, 7)

	ownedIDs, err := (&TaskService{DB: s.DB}).ownedProjectIDs(userID)
	if err != nil {
		return nil, err
	}

	base := s.DB.Model(&models.Task{})
	if len(ownedIDs) > 0 {
		base = base.Where("project_id IN ? OR assignee_id = ?", ownedIDs, userID)
	} else {
		base = base.Where("assignee_id = ?", userID)
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
	if len(ownedIDs) > 0 {
		q = q.Where("project_id IN ? OR assignee_id = ?", ownedIDs, userID)
	} else {
		q = q.Where("assignee_id = ?", userID)
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
	if len(ownedIDs) > 0 {
		q2 = q2.Where("project_id IN ? OR assignee_id = ?", ownedIDs, userID)
	} else {
		q2 = q2.Where("assignee_id = ?", userID)
	}
	q2 = q2.Where("updated_at >= ? AND updated_at < ?", start, end)
	if err := q2.Count(&completed).Error; err != nil {
		return nil, err
	}

	var pc int64
	_ = s.DB.Model(&models.Project{}).Where("owner_id = ?", userID).Count(&pc).Error

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

// Generate builds a task report file for the caller; admin may scope by user_ids.
func (s *ReportService) Generate(callerID uint, role models.Role, req GenerateRequest) ([]byte, string, string, error) {
	format := strings.ToLower(strings.TrimSpace(req.Format))
	if format != "csv" && format != "xlsx" && format != "pdf" {
		return nil, "", "", ErrInvalidInput
	}

	groupBy := strings.TrimSpace(strings.ToLower(req.GroupBy))
	switch groupBy {
	case "", "project", "status", "priority", "assignee":
	default:
		return nil, "", "", ErrInvalidInput
	}

	if role != models.RoleAdmin && len(req.UserIDs) > 0 {
		return nil, "", "", ErrForbidden
	}

	q := s.DB.Model(&models.Task{}).Preload("Project").Preload("Assignee")
	taskSvc := &TaskService{DB: s.DB}

	if role == models.RoleAdmin && len(req.UserIDs) > 0 {
		q = q.Joins("LEFT JOIN projects AS rep_proj ON rep_proj.id = tasks.project_id").
			Where("(tasks.assignee_id IN ?) OR (rep_proj.owner_id IN ?)", req.UserIDs, req.UserIDs)
	} else if role != models.RoleAdmin {
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

	return BuildReportFile(format, tasks, req.Fields, groupBy)
}
