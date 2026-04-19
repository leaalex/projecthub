package report

import (
	"context"
	"time"
)

// ReportFilter — параметры выборки задач для отчётов и weekly.
type ReportFilter struct {
	CallerID          uint
	IsSystem          bool
	VisibleProjectIDs []uint
	ProjectIDs        []uint
	UserIDs           []uint
	Statuses          []string
	Priorities        []string
	DateFrom          *time.Time
	DateTo            *time.Time
}

// TaskQuery — порт read-модели задач для отчётов.
type TaskQuery interface {
	ListForReport(ctx context.Context, f ReportFilter) ([]TaskProjection, error)
	WeeklyStats(ctx context.Context, f ReportFilter, weekStart, weekEnd time.Time) (WeeklyStats, error)
}
