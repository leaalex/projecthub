package report

import "time"

// WeeklyStats — агрегаты за календарную неделю (UTC, Пн–Вс).
type WeeklyStats struct {
	WeekStart       string         `json:"week_start"`
	WeekEnd         string         `json:"week_end"`
	TotalTasks      int64          `json:"total_tasks"`
	ByStatus        map[string]int `json:"by_status"`
	CompletedInWeek int64          `json:"completed_in_week"`
	ProjectsCount   int64          `json:"projects_count"`
}

// WeekWindow возвращает [start, end) для текущей недели в UTC (понедельник 00:00).
func WeekWindow(now time.Time) (start, end time.Time) {
	now = now.UTC()
	weekday := int(now.Weekday())
	if weekday == 0 {
		weekday = 7
	}
	start = time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC).AddDate(0, 0, -(weekday - 1))
	end = start.AddDate(0, 0, 7)
	return start, end
}
