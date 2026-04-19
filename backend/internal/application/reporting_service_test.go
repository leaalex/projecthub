package application

import (
	"context"
	"errors"
	"os"
	"path/filepath"
	"sync"
	"testing"
	"time"

	"task-manager/backend/internal/domain/report"
	"task-manager/backend/internal/domain/user"
)

type memReportRepo struct {
	mu     sync.Mutex
	nextID uint
	byID   map[uint]*report.SavedReport
}

func newMemReportRepo() *memReportRepo {
	return &memReportRepo{byID: make(map[uint]*report.SavedReport)}
}

func (m *memReportRepo) FindByID(ctx context.Context, id report.ID) (*report.SavedReport, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	r, ok := m.byID[id.Uint()]
	if !ok {
		return nil, report.ErrNotFound
	}
	return r, nil
}

func (m *memReportRepo) Save(ctx context.Context, r *report.SavedReport) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.nextID++
	r.ID = m.nextID
	r.CreatedAt = time.Now().UTC()
	m.byID[r.ID] = r
	return nil
}

func (m *memReportRepo) Delete(ctx context.Context, id report.ID) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	delete(m.byID, id.Uint())
	return nil
}

func (m *memReportRepo) ListForCaller(ctx context.Context, callerID uint, callerIsSystem bool) ([]*report.SavedReport, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	var out []*report.SavedReport
	for _, r := range m.byID {
		if callerIsSystem || r.UserID == callerID {
			out = append(out, r)
		}
	}
	return out, nil
}

type fakeTaskQuery struct {
	list []report.TaskProjection
	wk   report.WeeklyStats
	err  error
}

func (f *fakeTaskQuery) ListForReport(ctx context.Context, fl report.ReportFilter) ([]report.TaskProjection, error) {
	if f.err != nil {
		return nil, f.err
	}
	return f.list, nil
}

func (f *fakeTaskQuery) WeeklyStats(ctx context.Context, fl report.ReportFilter, weekStart, weekEnd time.Time) (report.WeeklyStats, error) {
	if f.err != nil {
		return report.WeeklyStats{}, f.err
	}
	out := f.wk
	out.WeekStart = weekStart.Format(time.RFC3339)
	out.WeekEnd = weekEnd.Format(time.RFC3339)
	return out, nil
}

type fakeVis struct {
	ids []uint
	err error
}

func (f *fakeVis) VisibleProjectIDs(ctx context.Context, userID uint) ([]uint, error) {
	if f.err != nil {
		return nil, f.err
	}
	return f.ids, nil
}

func TestReportingService_Generate_writesFileAndRecord(t *testing.T) {
	dir := t.TempDir()
	repo := newMemReportRepo()
	tq := &fakeTaskQuery{list: []report.TaskProjection{{ID: 1, Title: "A", ProjectName: "P", AssigneeName: "Unassigned"}}}
	svc := NewReportingService(repo, tq, &fakeVis{ids: []uint{1}}, dir)
	svc.Now = func() time.Time { return time.Date(2026, 4, 18, 12, 0, 0, 0, time.UTC) }

	params := report.GenerateParams{
		Format:    report.FormatCSV,
		GroupBy:   report.GroupByNone,
		PDFLayout: report.PDFLayoutTable,
	}
	rec, err := svc.Generate(context.Background(), 7, user.RoleUser, params)
	if err != nil {
		t.Fatal(err)
	}
	if rec.ID == 0 || rec.StorageKey == "" {
		t.Fatalf("record: %+v", rec)
	}
	full := filepath.Join(dir, rec.StorageKey)
	if _, err := os.Stat(full); err != nil {
		t.Fatal(err)
	}
}

func TestReportingService_Generate_forbiddenUserFilter(t *testing.T) {
	svc := NewReportingService(newMemReportRepo(), &fakeTaskQuery{}, &fakeVis{}, t.TempDir())
	params := report.GenerateParams{
		Format:    report.FormatCSV,
		GroupBy:   report.GroupByNone,
		PDFLayout: report.PDFLayoutTable,
		UserIDs:   []uint{9},
	}
	_, err := svc.Generate(context.Background(), 1, user.RoleUser, params)
	if !errors.Is(err, ErrForbidden) {
		t.Fatalf("got %v", err)
	}
}

func TestReportingService_Weekly(t *testing.T) {
	svc := NewReportingService(newMemReportRepo(), &fakeTaskQuery{
		wk: report.WeeklyStats{TotalTasks: 3, ByStatus: map[string]int{"todo": 3}},
	}, &fakeVis{ids: []uint{1}}, t.TempDir())
	svc.Now = func() time.Time { return time.Date(2026, 4, 15, 12, 0, 0, 0, time.UTC) }
	w, err := svc.Weekly(context.Background(), 1, user.RoleUser)
	if err != nil {
		t.Fatal(err)
	}
	if w.TotalTasks != 3 {
		t.Fatal(w)
	}
}

func TestReportingService_FilePath_notFound(t *testing.T) {
	svc := NewReportingService(newMemReportRepo(), &fakeTaskQuery{}, &fakeVis{}, t.TempDir())
	_, _, err := svc.FilePath(context.Background(), 99, 1, user.RoleUser)
	if !errors.Is(err, report.ErrNotFound) {
		t.Fatalf("got %v", err)
	}
}

func TestReportingService_Delete_forbidden(t *testing.T) {
	repo := newMemReportRepo()
	_ = repo.Save(context.Background(), report.NewSavedReport(2, "k.csv", "x.csv", report.FormatCSV, 1, "{}", time.Now()))
	var id uint
	for id = range repo.byID {
		break
	}
	svc := NewReportingService(repo, &fakeTaskQuery{}, &fakeVis{}, t.TempDir())
	err := svc.Delete(context.Background(), id, 99, user.RoleUser)
	if !errors.Is(err, ErrForbidden) {
		t.Fatalf("got %v", err)
	}
}
