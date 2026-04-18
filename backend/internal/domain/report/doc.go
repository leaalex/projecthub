// Package report содержит корень агрегата SavedReport.
//
// Инварианты и транзакционные границы задокументированы в
// docs/architecture/aggregates.md (раздел «Report Aggregate»).
//
// Типы переносятся сюда инкрементально из backend/internal/models,
// backend/internal/services/report_service.go и
// backend/internal/services/report_export.go в последующих PR.
package report
