package services

import (
	"bytes"
	"encoding/csv"
	"fmt"
	"sort"
	"strings"
	"time"

	"task-manager/backend/internal/models"
	"task-manager/backend/internal/services/pdffonts"

	"github.com/go-pdf/fpdf"
	"github.com/xuri/excelize/v2"
)

// Ключи полей отчёта (JSON / API).
const (
	ReportFieldTitle       = "title"
	ReportFieldDescription = "description"
	ReportFieldStatus      = "status"
	ReportFieldPriority    = "priority"
	ReportFieldProject     = "project"
	ReportFieldAssignee    = "assignee"
	ReportFieldDueDate     = "due_date"
	ReportFieldCreatedAt   = "created_at"
	ReportFieldUpdatedAt   = "updated_at"
)

var allowedReportFields = map[string]bool{
	ReportFieldTitle:       true,
	ReportFieldDescription: true,
	ReportFieldStatus:      true,
	ReportFieldPriority:    true,
	ReportFieldProject:     true,
	ReportFieldAssignee:    true,
	ReportFieldDueDate:     true,
	ReportFieldCreatedAt:   true,
	ReportFieldUpdatedAt:   true,
}

// PDFLayoutTable рисует сетку колонок; PDFLayoutList рисует один блок на задачу (строки «метка: значение»).
const (
	PDFLayoutTable = "table"
	PDFLayoutList  = "list"
)

var defaultReportFields = []string{
	ReportFieldTitle,
	ReportFieldDescription,
	ReportFieldStatus,
	ReportFieldPriority,
	ReportFieldProject,
	ReportFieldAssignee,
	ReportFieldDueDate,
	ReportFieldCreatedAt,
	ReportFieldUpdatedAt,
}

func fieldHeader(key string) string {
	switch key {
	case ReportFieldTitle:
		return "Title"
	case ReportFieldDescription:
		return "Description"
	case ReportFieldStatus:
		return "Status"
	case ReportFieldPriority:
		return "Priority"
	case ReportFieldProject:
		return "Project"
	case ReportFieldAssignee:
		return "Assignee"
	case ReportFieldDueDate:
		return "Due date"
	case ReportFieldCreatedAt:
		return "Created at"
	case ReportFieldUpdatedAt:
		return "Updated at"
	default:
		return key
	}
}

// NormalizeReportFields возвращает отфильтрованный упорядоченный список полей.
func NormalizeReportFields(fields []string) []string {
	if len(fields) == 0 {
		out := make([]string, len(defaultReportFields))
		copy(out, defaultReportFields)
		return out
	}
	seen := make(map[string]bool)
	var out []string
	for _, f := range fields {
		f = strings.TrimSpace(strings.ToLower(f))
		if !allowedReportFields[f] || seen[f] {
			continue
		}
		seen[f] = true
		out = append(out, f)
	}
	if len(out) == 0 {
		out = append(out, defaultReportFields...)
	}
	return out
}

func assigneeLabel(t *models.Task) string {
	if t.AssigneeID == nil || t.Assignee == nil {
		return "Unassigned"
	}
	if strings.TrimSpace(t.Assignee.Name) != "" {
		return t.Assignee.Name
	}
	return t.Assignee.Email
}

func projectName(t *models.Task) string {
	return t.Project.Name
}

func formatTimePtr(p *time.Time) string {
	if p == nil {
		return ""
	}
	return p.UTC().Format(time.RFC3339)
}

func formatTime(t time.Time) string {
	return t.UTC().Format(time.RFC3339)
}

func taskCell(t *models.Task, field string) string {
	switch field {
	case ReportFieldTitle:
		return t.Title
	case ReportFieldDescription:
		return t.Description
	case ReportFieldStatus:
		return string(t.Status)
	case ReportFieldPriority:
		return string(t.Priority)
	case ReportFieldProject:
		return projectName(t)
	case ReportFieldAssignee:
		return assigneeLabel(t)
	case ReportFieldDueDate:
		return formatTimePtr(t.DueDate)
	case ReportFieldCreatedAt:
		return formatTime(t.CreatedAt)
	case ReportFieldUpdatedAt:
		return formatTime(t.UpdatedAt)
	default:
		return ""
	}
}

func taskRowCells(t *models.Task, fields []string) []string {
	row := make([]string, len(fields))
	for i, f := range fields {
		row[i] = taskCell(t, f)
	}
	return row
}

func headerRow(fields []string) []string {
	h := make([]string, len(fields))
	for i, f := range fields {
		h[i] = fieldHeader(f)
	}
	return h
}

func groupLabel(t *models.Task, groupBy string) string {
	switch groupBy {
	case "project":
		return projectName(t)
	case "status":
		return string(t.Status)
	case "priority":
		return string(t.Priority)
	case "assignee":
		return assigneeLabel(t)
	default:
		return ""
	}
}

// SortTasksByGroup сортирует задачи на месте для стабильного порядка при экспорте по группам.
func SortTasksByGroup(tasks []models.Task, groupBy string) {
	if groupBy == "" {
		sort.SliceStable(tasks, func(i, j int) bool {
			return tasks[i].ID < tasks[j].ID
		})
		return
	}
	sort.SliceStable(tasks, func(i, j int) bool {
		gi, gj := groupLabel(&tasks[i], groupBy), groupLabel(&tasks[j], groupBy)
		if gi != gj {
			return gi < gj
		}
		return tasks[i].ID < tasks[j].ID
	})
}

func buildCSV(tasks []models.Task, fields []string, groupBy string) ([]byte, error) {
	var buf bytes.Buffer
	w := csv.NewWriter(&buf)
	fields = NormalizeReportFields(fields)
	_ = w.Write(headerRow(fields))
	var prevGroup string
	hasGroup := groupBy != ""
	for i := range tasks {
		t := &tasks[i]
		if hasGroup {
			g := groupLabel(t, groupBy)
			if i == 0 || g != prevGroup {
				_ = w.Write([]string{fmt.Sprintf("--- %s: %s ---", groupBy, g)})
				prevGroup = g
			}
		}
		_ = w.Write(taskRowCells(t, fields))
	}
	w.Flush()
	return buf.Bytes(), w.Error()
}

func buildXLSX(tasks []models.Task, fields []string, groupBy string) ([]byte, error) {
	fields = NormalizeReportFields(fields)
	f := excelize.NewFile()
	defer func() { _ = f.Close() }()
	sheet := "Tasks"
	idx, err := f.NewSheet(sheet)
	if err != nil {
		return nil, err
	}
	_ = f.DeleteSheet("Sheet1")
	f.SetActiveSheet(idx)

	row := 1
	headers := headerRow(fields)
	for c, h := range headers {
		cell, _ := excelize.CoordinatesToCellName(c+1, row)
		_ = f.SetCellValue(sheet, cell, h)
	}
	styleID, _ := f.NewStyle(&excelize.Style{Font: &excelize.Font{Bold: true}})
	if len(headers) > 0 {
		c1, _ := excelize.CoordinatesToCellName(1, row)
		c2, _ := excelize.CoordinatesToCellName(len(headers), row)
		_ = f.SetCellStyle(sheet, c1, c2, styleID)
	}
	row++

	prevGroup := ""
	hasGroup := groupBy != ""
	for i := range tasks {
		t := &tasks[i]
		if hasGroup {
			g := groupLabel(t, groupBy)
			if i == 0 || g != prevGroup {
				cell, _ := excelize.CoordinatesToCellName(1, row)
				_ = f.SetCellValue(sheet, cell, fmt.Sprintf("Group (%s): %s", groupBy, g))
				row++
				prevGroup = g
			}
		}
		cells := taskRowCells(t, fields)
		for c, v := range cells {
			cell, _ := excelize.CoordinatesToCellName(c+1, row)
			_ = f.SetCellValue(sheet, cell, v)
		}
		row++
	}

	var buf bytes.Buffer
	if err := f.Write(&buf); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

// buildTXT записывает отчёт в формате UTF-8 plain-text (читаемые блоки по каждой задаче).
func buildTXT(tasks []models.Task, fields []string, groupBy string) ([]byte, error) {
	fields = NormalizeReportFields(fields)
	var b strings.Builder
	b.WriteString("Tasks report\n")
	b.WriteString(fmt.Sprintf("Generated: %s\n\n", time.Now().UTC().Format(time.RFC3339)))

	prevGroup := ""
	hasGroup := groupBy != ""
	for i := range tasks {
		t := &tasks[i]
		if hasGroup {
			g := groupLabel(t, groupBy)
			if i == 0 || g != prevGroup {
				b.WriteString(fmt.Sprintf("=== Group (%s): %s ===\n\n", groupBy, g))
				prevGroup = g
			}
		}
		b.WriteString(fmt.Sprintf("--- Task #%d ---\n", t.ID))
		for _, f := range fields {
			b.WriteString(fieldHeader(f))
			b.WriteString(": ")
			b.WriteString(taskCell(t, f))
			b.WriteString("\n")
		}
		b.WriteString("\n")
	}
	return []byte(b.String()), nil
}

func pdfSafe(s string) string {
	s = strings.ReplaceAll(s, "\r", " ")
	s = strings.ReplaceAll(s, "\n", " ")
	if len(s) > 500 {
		s = s[:497] + "..."
	}
	return s
}

func pdfNeedNewPage(pdf *fpdf.Fpdf, nextBlockH float64) bool {
	const bottomY = 185.0
	return pdf.GetY()+nextBlockH > bottomY
}

func buildPDF(tasks []models.Task, fields []string, groupBy, layout string) ([]byte, error) {
	fields = NormalizeReportFields(fields)
	pdf := fpdf.New("L", "mm", "A4", "")
	pdffonts.RegisterUTF8Fonts(pdf)
	pdf.SetTitle("Tasks report", true)

	layout = strings.ToLower(strings.TrimSpace(layout))
	if layout != PDFLayoutList {
		layout = PDFLayoutTable
	}

	if layout == PDFLayoutList {
		buildPDFList(pdf, tasks, fields, groupBy)
	} else {
		buildPDFTable(pdf, tasks, fields, groupBy)
	}

	var buf bytes.Buffer
	err := pdf.Output(&buf)
	return buf.Bytes(), err
}

func buildPDFTable(pdf *fpdf.Fpdf, tasks []models.Task, fields []string, groupBy string) {
	ff := pdffonts.Family
	pdf.AddPage()
	pdf.SetFont(ff, "B", 10)
	pdf.Cell(0, 8, "Tasks report")
	pdf.Ln(10)
	pdf.SetFont(ff, "", 8)

	colCount := len(fields)
	if colCount == 0 {
		colCount = 1
	}
	pageW, _ := pdf.GetPageSize()
	marginL, _, marginR, _ := pdf.GetMargins()
	usable := pageW - marginL - marginR
	colW := usable / float64(colCount)
	if colW < 20 {
		colW = usable / float64(colCount)
	}

	writeRow := func(cells []string, bold bool) {
		if bold {
			pdf.SetFont(ff, "B", 8)
		} else {
			pdf.SetFont(ff, "", 7)
		}
		x0, y0 := pdf.GetXY()
		maxH := 6.0
		for i, cell := range cells {
			if i >= colCount {
				break
			}
			txt := pdfSafe(cell)
			lines := pdf.SplitLines([]byte(txt), colW-2)
			h := float64(len(lines)) * 4.5
			if h > maxH {
				maxH = h
			}
		}
		x := x0
		for i, cell := range cells {
			if i >= colCount {
				break
			}
			txt := pdfSafe(cell)
			pdf.Rect(x, y0, colW, maxH, "D")
			pdf.SetXY(x+1, y0+1)
			pdf.MultiCell(colW-2, 4.5, txt, "", "L", false)
			x += colW
		}
		pdf.SetXY(x0, y0+maxH)
	}

	writeRow(headerRow(fields), true)

	prevGroup := ""
	hasGroup := groupBy != ""
	for i := range tasks {
		t := &tasks[i]
		if hasGroup {
			g := groupLabel(t, groupBy)
			if i == 0 || g != prevGroup {
				pdf.Ln(2)
				pdf.SetFont(ff, "B", 9)
				pdf.Cell(0, 6, pdfSafe(fmt.Sprintf("Group (%s): %s", groupBy, g)))
				pdf.Ln(8)
				prevGroup = g
			}
		}
		writeRow(taskRowCells(t, fields), false)
		if pdf.GetY() > 185 {
			pdf.AddPage()
			writeRow(headerRow(fields), true)
		}
	}
}

func buildPDFList(pdf *fpdf.Fpdf, tasks []models.Task, fields []string, groupBy string) {
	ff := pdffonts.Family
	pageW, _ := pdf.GetPageSize()
	marginL, _, marginR, _ := pdf.GetMargins()
	usable := pageW - marginL - marginR
	const lineH = 5.0
	const taskHeaderH = 6.0

	pdf.AddPage()
	pdf.SetFont(ff, "B", 11)
	pdf.MultiCell(usable, 7, "Tasks report", "", "L", false)
	pdf.Ln(3)

	prevGroup := ""
	hasGroup := groupBy != ""
	for i := range tasks {
		t := &tasks[i]
		if hasGroup {
			g := groupLabel(t, groupBy)
			if i == 0 || g != prevGroup {
				blockH := 10.0
				if pdfNeedNewPage(pdf, blockH) {
					pdf.AddPage()
				}
				pdf.SetFont(ff, "B", 9)
				pdf.MultiCell(usable, 6, pdfSafe(fmt.Sprintf("Group (%s): %s", groupBy, g)), "", "L", false)
				pdf.Ln(2)
				prevGroup = g
			}
		}

		estH := taskHeaderH + float64(len(fields))*lineH + 6
		if pdfNeedNewPage(pdf, estH) {
			pdf.AddPage()
		}

		pdf.SetFont(ff, "B", 9)
		pdf.MultiCell(usable, taskHeaderH, pdfSafe(fmt.Sprintf("Task #%d", t.ID)), "", "L", false)
		pdf.SetFont(ff, "", 8)
		for _, f := range fields {
			line := fieldHeader(f) + ": " + pdfSafe(taskCell(t, f))
			pdf.MultiCell(usable, lineH, line, "", "L", false)
		}
		pdf.Ln(4)
	}
}

// BuildReportFile строит байты экспорта из предзагруженных задач.
// pdfLayout — PDFLayoutTable или PDFLayoutList; игнорируется для csv/xlsx.
func BuildReportFile(format string, tasks []models.Task, fields []string, groupBy, pdfLayout string) ([]byte, string, string, error) {
	format = strings.ToLower(strings.TrimSpace(format))
	fields = NormalizeReportFields(fields)
	SortTasksByGroup(tasks, groupBy)

	ts := time.Now().UTC().Format("20060102-150405")
	var name, mime string
	switch format {
	case "csv":
		b, err := buildCSV(tasks, fields, groupBy)
		return b, fmt.Sprintf("tasks-report-%s.csv", ts), "text/csv; charset=utf-8", err
	case "xlsx":
		b, err := buildXLSX(tasks, fields, groupBy)
		name = fmt.Sprintf("tasks-report-%s.xlsx", ts)
		mime = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
		return b, name, mime, err
	case "pdf":
		b, err := buildPDF(tasks, fields, groupBy, pdfLayout)
		return b, fmt.Sprintf("tasks-report-%s.pdf", ts), "application/pdf", err
	case "txt":
		b, err := buildTXT(tasks, fields, groupBy)
		return b, fmt.Sprintf("tasks-report-%s.txt", ts), "text/plain; charset=utf-8", err
	default:
		return nil, "", "", ErrInvalidInput
	}
}
