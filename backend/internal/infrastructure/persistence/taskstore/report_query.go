package taskstore

import (
	"context"
	"time"

	"task-manager/backend/internal/domain/report"
	"task-manager/backend/internal/domain/task"
	"task-manager/backend/internal/domain/user"

	"gorm.io/gorm"
)

// ReportQuery реализует report.TaskQuery поверх GORM.
type ReportQuery struct {
	db *gorm.DB
}

// NewReportQuery создаёт адаптер выборки задач для отчётов.
func NewReportQuery(db *gorm.DB) *ReportQuery {
	return &ReportQuery{db: db}
}

// projectForReport — минимальная проекция projects (без импорта projectstore — цикл импортов).
type projectForReport struct {
	ID        uint           `gorm:"column:id"`
	Name      string         `gorm:"column:name"`
	OwnerID   uint           `gorm:"column:owner_id"`
	DeletedAt gorm.DeletedAt `gorm:"column:deleted_at"`
}

func (projectForReport) TableName() string { return "projects" }

// userForReport — минимальная проекция users для отображаемого имени.
type userForReport struct {
	ID         uint   `gorm:"column:id"`
	Email      string `gorm:"column:email"`
	Name       string `gorm:"column:name"`
	LastName   string `gorm:"column:last_name"`
	FirstName  string `gorm:"column:first_name"`
	Patronymic string `gorm:"column:patronymic"`
}

func (userForReport) TableName() string { return "users" }

// taskForReport — строка tasks с preload Project и Assignee.
type taskForReport struct {
	ID          uint             `gorm:"column:id"`
	Title       string           `gorm:"column:title"`
	Description string           `gorm:"column:description"`
	Status      string           `gorm:"column:status"`
	Priority    string           `gorm:"column:priority"`
	ProjectID   uint             `gorm:"column:project_id"`
	AssigneeID  *uint            `gorm:"column:assignee_id"`
	DueDate     *time.Time       `gorm:"column:due_date"`
	CreatedAt   time.Time        `gorm:"column:created_at"`
	UpdatedAt   time.Time        `gorm:"column:updated_at"`
	Project     projectForReport `gorm:"foreignKey:ProjectID"`
	Assignee    *userForReport   `gorm:"foreignKey:AssigneeID"`
}

func (taskForReport) TableName() string { return "tasks" }

func assigneeDisplayName(u *userForReport) string {
	if u == nil {
		return "Unassigned"
	}
	fn := user.FullName{
		LastName:   u.LastName,
		FirstName:  u.FirstName,
		Patronymic: u.Patronymic,
		Legacy:     u.Name,
	}
	if dn := fn.DisplayName(); dn != "" {
		return dn
	}
	return u.Email
}

func (q *ReportQuery) toProjection(row *taskForReport) (report.TaskProjection, error) {
	st, _ := task.ParseStatus(row.Status)
	if !st.IsValid() {
		st = task.StatusTodo
	}
	pr, _ := task.ParsePriority(row.Priority)
	if !pr.IsValid() {
		pr = task.PriorityMedium
	}
	return report.TaskProjection{
		ID:           row.ID,
		Title:        row.Title,
		Description:  row.Description,
		Status:       st,
		Priority:     pr,
		ProjectName:  row.Project.Name,
		AssigneeName: assigneeDisplayName(row.Assignee),
		DueDate:      row.DueDate,
		CreatedAt:    row.CreatedAt,
		UpdatedAt:    row.UpdatedAt,
	}, nil
}

func (q *ReportQuery) baseQuery(f report.ReportFilter) *gorm.DB {
	tx := q.db.Model(&taskForReport{}).
		Preload("Project").
		Preload("Assignee").
		Joins("JOIN projects ON projects.id = tasks.project_id AND projects.deleted_at IS NULL")

	if f.IsSystem && len(f.UserIDs) > 0 {
		tx = tx.Where("(tasks.assignee_id IN ?) OR (projects.owner_id IN ?)", f.UserIDs, f.UserIDs)
	} else if !f.IsSystem {
		if len(f.VisibleProjectIDs) > 0 {
			tx = tx.Where("tasks.project_id IN ? OR tasks.assignee_id = ?", f.VisibleProjectIDs, f.CallerID)
		} else {
			tx = tx.Where("tasks.assignee_id = ?", f.CallerID)
		}
	}

	if len(f.ProjectIDs) > 0 {
		tx = tx.Where("tasks.project_id IN ?", f.ProjectIDs)
	}
	if len(f.Statuses) > 0 {
		tx = tx.Where("tasks.status IN ?", f.Statuses)
	}
	if len(f.Priorities) > 0 {
		tx = tx.Where("tasks.priority IN ?", f.Priorities)
	}
	if f.DateFrom != nil {
		tx = tx.Where("tasks.created_at >= ?", *f.DateFrom)
	}
	if f.DateTo != nil {
		tx = tx.Where("tasks.created_at < ?", *f.DateTo)
	}
	return tx
}

// ListForReport возвращает задачи для экспорта.
func (q *ReportQuery) ListForReport(ctx context.Context, f report.ReportFilter) ([]report.TaskProjection, error) {
	var rows []taskForReport
	if err := q.baseQuery(f).WithContext(ctx).Order("tasks.id asc").Find(&rows).Error; err != nil {
		return nil, err
	}
	out := make([]report.TaskProjection, 0, len(rows))
	for i := range rows {
		p, err := q.toProjection(&rows[i])
		if err != nil {
			return nil, err
		}
		out = append(out, p)
	}
	return out, nil
}

// WeeklyStats считает агрегаты за неделю [weekStart, weekEnd).
func (q *ReportQuery) WeeklyStats(ctx context.Context, f report.ReportFilter, weekStart, weekEnd time.Time) (report.WeeklyStats, error) {
	base := q.baseQuery(f)

	var total int64
	if err := base.Session(&gorm.Session{}).WithContext(ctx).Count(&total).Error; err != nil {
		return report.WeeklyStats{}, err
	}

	var byStatus []struct {
		Status string
		Cnt    int
	}
	if err := q.baseQuery(f).WithContext(ctx).
		Select("tasks.status, count(*) as cnt").
		Group("tasks.status").
		Scan(&byStatus).Error; err != nil {
		return report.WeeklyStats{}, err
	}
	m := make(map[string]int)
	for _, r := range byStatus {
		m[r.Status] = r.Cnt
	}

	var completed int64
	q2 := q.baseQuery(f).WithContext(ctx).Where("tasks.status = ?", string(task.StatusDone)).
		Where("tasks.updated_at >= ? AND tasks.updated_at < ?", weekStart, weekEnd)
	if err := q2.Count(&completed).Error; err != nil {
		return report.WeeklyStats{}, err
	}

	var pc int64
	if f.IsSystem {
		_ = q.db.WithContext(ctx).Model(&projectForReport{}).Count(&pc).Error
	} else if len(f.VisibleProjectIDs) > 0 {
		_ = q.db.WithContext(ctx).Model(&projectForReport{}).
			Where("id IN ?", f.VisibleProjectIDs).Count(&pc).Error
	}

	return report.WeeklyStats{
		WeekStart:       weekStart.Format(time.RFC3339),
		WeekEnd:         weekEnd.Format(time.RFC3339),
		TotalTasks:      total,
		ByStatus:        m,
		CompletedInWeek: completed,
		ProjectsCount:   pc,
	}, nil
}
