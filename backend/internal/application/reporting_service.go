package application

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"time"

	"task-manager/backend/internal/domain/report"
	"task-manager/backend/internal/domain/user"
	"task-manager/backend/internal/infrastructure/reportexport"
)

// VisibilityPort — видимые проекты для отчётов (реализация: TaskService.VisibleProjectIDs).
type VisibilityPort interface {
	VisibleProjectIDs(ctx context.Context, userID uint) ([]uint, error)
}

// ReportingService — сценарии отчётов и сохранённых экспортов.
type ReportingService struct {
	Reports    report.Repository
	Tasks      report.TaskQuery
	Visibility VisibilityPort
	ReportsDir string
	Now        func() time.Time
}

// NewReportingService создаёт сервис отчётов.
func NewReportingService(
	reports report.Repository,
	tasks report.TaskQuery,
	visibility VisibilityPort,
	reportsDir string,
) *ReportingService {
	return &ReportingService{
		Reports:    reports,
		Tasks:      tasks,
		Visibility: visibility,
		ReportsDir: reportsDir,
		Now:        time.Now,
	}
}

func (s *ReportingService) now() time.Time {
	if s.Now != nil {
		return s.Now()
	}
	return time.Now()
}

func randomStorageKey(ext string) (string, error) {
	var b [16]byte
	if _, err := io.ReadFull(rand.Reader, b[:]); err != nil {
		return "", err
	}
	return hex.EncodeToString(b[:]) + ext, nil
}

func (s *ReportingService) reportFilter(ctx context.Context, callerID uint, role user.Role, params *report.GenerateParams) (report.ReportFilter, error) {
	isSys := user.IsSystemRole(role)
	f := report.ReportFilter{
		CallerID:   callerID,
		IsSystem:   isSys,
		ProjectIDs: append([]uint(nil), params.ProjectIDs...),
		UserIDs:    append([]uint(nil), params.UserIDs...),
		DateFrom:   params.DateFrom,
		DateTo:     params.DateTo,
	}
	for _, st := range params.Statuses {
		f.Statuses = append(f.Statuses, st.String())
	}
	for _, pr := range params.Priorities {
		f.Priorities = append(f.Priorities, pr.String())
	}
	if !isSys {
		if len(params.UserIDs) > 0 {
			return report.ReportFilter{}, ErrForbidden
		}
		if s.Visibility == nil {
			return report.ReportFilter{}, fmt.Errorf("reporting: Visibility is required")
		}
		vis, err := s.Visibility.VisibleProjectIDs(ctx, callerID)
		if err != nil {
			return report.ReportFilter{}, err
		}
		f.VisibleProjectIDs = vis
	}
	return f, nil
}

// Weekly возвращает агрегаты за текущую календарную неделю.
func (s *ReportingService) Weekly(ctx context.Context, callerID uint, role user.Role) (report.WeeklyStats, error) {
	params := &report.GenerateParams{Format: report.FormatCSV, GroupBy: report.GroupByNone, PDFLayout: report.PDFLayoutTable}
	f, err := s.reportFilter(ctx, callerID, role, params)
	if err != nil {
		return report.WeeklyStats{}, err
	}
	start, end := report.WeekWindow(s.now())
	return s.Tasks.WeeklyStats(ctx, f, start, end)
}

// Generate создаёт файл отчёта и сохраняет метаданные.
func (s *ReportingService) Generate(ctx context.Context, callerID uint, role user.Role, params report.GenerateParams) (*report.SavedReport, error) {
	if strings.TrimSpace(s.ReportsDir) == "" {
		return nil, report.ErrReportsDirUnset
	}
	if err := params.Validate(); err != nil {
		return nil, err
	}
	if err := os.MkdirAll(s.ReportsDir, 0o755); err != nil {
		return nil, err
	}

	f, err := s.reportFilter(ctx, callerID, role, &params)
	if err != nil {
		return nil, err
	}

	tasks, err := s.Tasks.ListForReport(ctx, f)
	if err != nil {
		return nil, err
	}

	data, displayName, _, err := reportexport.Build(params.Format, tasks, params.Fields, params.GroupBy, params.PDFLayout)
	if err != nil {
		return nil, err
	}

	ext := params.Format.Ext()
	storageKey, err := randomStorageKey(ext)
	if err != nil {
		return nil, err
	}
	fullPath := filepath.Join(s.ReportsDir, storageKey)
	if err := os.WriteFile(fullPath, data, 0o644); err != nil {
		return nil, err
	}

	filtersJSON, _ := json.Marshal(paramsSnap(params))
	rep := report.NewSavedReport(
		callerID,
		storageKey,
		filepath.Base(displayName),
		params.Format,
		int64(len(data)),
		string(filtersJSON),
		s.now().UTC(),
	)
	if err := s.Reports.Save(ctx, rep); err != nil {
		_ = os.Remove(fullPath)
		return nil, err
	}
	return rep, nil
}

type generateParamsSnap struct {
	Format     string   `json:"format"`
	DateFrom   *string  `json:"date_from,omitempty"`
	DateTo     *string  `json:"date_to,omitempty"`
	ProjectIDs []uint   `json:"project_ids"`
	UserIDs    []uint   `json:"user_ids"`
	Statuses   []string `json:"statuses"`
	Priorities []string `json:"priorities"`
	Fields     []string `json:"fields"`
	GroupBy    string   `json:"group_by"`
	PdfLayout  string   `json:"pdf_layout"`
}

func paramsSnap(p report.GenerateParams) generateParamsSnap {
	snap := generateParamsSnap{
		Format:     string(p.Format),
		ProjectIDs: p.ProjectIDs,
		UserIDs:    p.UserIDs,
		Fields:     p.Fields,
		GroupBy:    string(p.GroupBy),
		PdfLayout:  string(p.PDFLayout),
	}
	for _, st := range p.Statuses {
		snap.Statuses = append(snap.Statuses, st.String())
	}
	for _, pr := range p.Priorities {
		snap.Priorities = append(snap.Priorities, pr.String())
	}
	if p.DateFrom != nil {
		s := p.DateFrom.UTC().Format("2006-01-02")
		snap.DateFrom = &s
	}
	if p.DateTo != nil {
		s := p.DateTo.UTC().Format("2006-01-02")
		snap.DateTo = &s
	}
	return snap
}

// List возвращает сохранённые экспорты (админы — все).
func (s *ReportingService) List(ctx context.Context, callerID uint, role user.Role) ([]*report.SavedReport, error) {
	return s.Reports.ListForCaller(ctx, callerID, user.IsSystemRole(role))
}

// FilePath возвращает доменную запись и абсолютный путь к файлу после ACL и проверки существования.
func (s *ReportingService) FilePath(ctx context.Context, id uint, callerID uint, role user.Role) (*report.SavedReport, string, error) {
	r, err := s.Reports.FindByID(ctx, report.ID(id))
	if err != nil {
		return nil, "", err
	}
	if !user.IsSystemRole(role) && !r.BelongsTo(callerID) {
		return nil, "", ErrForbidden
	}
	full := filepath.Join(s.ReportsDir, r.StorageKey)
	if _, err := os.Stat(full); err != nil {
		if os.IsNotExist(err) {
			return nil, "", report.ErrNotFound
		}
		return nil, "", err
	}
	return r, full, nil
}

// Delete удаляет метаданные и файл после ACL.
func (s *ReportingService) Delete(ctx context.Context, id uint, callerID uint, role user.Role) error {
	r, err := s.Reports.FindByID(ctx, report.ID(id))
	if err != nil {
		return err
	}
	if !user.IsSystemRole(role) && !r.BelongsTo(callerID) {
		return ErrForbidden
	}
	full := filepath.Join(s.ReportsDir, r.StorageKey)
	_ = os.Remove(full)
	return s.Reports.Delete(ctx, report.ID(id))
}

// FormatMIME — Content-Type по строке формата из БД.
func FormatMIME(format string) string {
	f, err := report.ParseFormat(format)
	if err != nil {
		return "application/octet-stream"
	}
	return f.MIME()
}
