// Package reportexport строит байты файлов отчётов (CSV/XLSX/PDF/TXT) из read-модели domain/report.
package reportexport

import (
	"fmt"
	"sort"
	"time"

	"task-manager/backend/internal/domain/report"
)

// Build формирует файл отчёта; fields — ключи полей (до нормализации).
func Build(format report.Format, tasks []report.TaskProjection, fields []string, groupBy report.GroupBy, layout report.PDFLayout) ([]byte, string, string, error) {
	fields = report.NormalizeFields(fields)
	sortTasksByGroup(tasks, groupBy)

	ts := time.Now().UTC().Format("20060102-150405")
	switch format {
	case report.FormatCSV:
		b, err := buildCSV(tasks, fields, groupBy)
		return b, fmt.Sprintf("tasks-report-%s.csv", ts), report.FormatCSV.MIME(), err
	case report.FormatXLSX:
		b, err := buildXLSX(tasks, fields, groupBy)
		return b, fmt.Sprintf("tasks-report-%s.xlsx", ts), report.FormatXLSX.MIME(), err
	case report.FormatPDF:
		b, err := buildPDF(tasks, fields, groupBy, layout)
		return b, fmt.Sprintf("tasks-report-%s.pdf", ts), report.FormatPDF.MIME(), err
	case report.FormatTXT:
		b, err := buildTXT(tasks, fields, groupBy)
		return b, fmt.Sprintf("tasks-report-%s.txt", ts), report.FormatTXT.MIME(), err
	default:
		return nil, "", "", report.ErrInvalidFormat
	}
}

func sortTasksByGroup(tasks []report.TaskProjection, groupBy report.GroupBy) {
	if groupBy == report.GroupByNone {
		sort.SliceStable(tasks, func(i, j int) bool {
			return tasks[i].ID < tasks[j].ID
		})
		return
	}
	sort.SliceStable(tasks, func(i, j int) bool {
		gi, gj := tasks[i].GroupLabel(groupBy), tasks[j].GroupLabel(groupBy)
		if gi != gj {
			return gi < gj
		}
		return tasks[i].ID < tasks[j].ID
	})
}

func headerRow(fields []string) []string {
	h := make([]string, len(fields))
	for i, f := range fields {
		h[i] = report.FieldHeader(f)
	}
	return h
}

func taskRowCells(t *report.TaskProjection, fields []string) []string {
	row := make([]string, len(fields))
	for i, f := range fields {
		row[i] = t.Cell(f)
	}
	return row
}
