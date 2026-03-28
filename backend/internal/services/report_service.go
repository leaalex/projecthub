package services

import (
	"time"

	"task-manager/backend/internal/models"

	"gorm.io/gorm"
)

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
	s.DB.Model(&models.Project{}).Where("owner_id = ?", userID).Count(&pc)

	return &WeeklyReport{
		WeekStart:       start.Format(time.RFC3339),
		WeekEnd:         end.Format(time.RFC3339),
		TotalTasks:      total,
		ByStatus:        m,
		CompletedInWeek: completed,
		ProjectsCount:   pc,
	}, nil
}
