package reportexport

import (
	"bytes"
	"encoding/csv"
	"fmt"
	"strings"
	"time"

	"task-manager/backend/internal/domain/report"
	"task-manager/backend/internal/infrastructure/reportexport/pdffonts"

	"github.com/go-pdf/fpdf"
	"github.com/xuri/excelize/v2"
)

func buildCSV(tasks []report.TaskProjection, fields []string, groupBy report.GroupBy) ([]byte, error) {
	var buf bytes.Buffer
	w := csv.NewWriter(&buf)
	fields = report.NormalizeFields(fields)
	_ = w.Write(headerRow(fields))
	var prevGroup string
	hasGroup := groupBy != report.GroupByNone
	for i := range tasks {
		t := &tasks[i]
		if hasGroup {
			g := t.GroupLabel(groupBy)
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

func buildXLSX(tasks []report.TaskProjection, fields []string, groupBy report.GroupBy) ([]byte, error) {
	fields = report.NormalizeFields(fields)
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
	hasGroup := groupBy != report.GroupByNone
	for i := range tasks {
		t := &tasks[i]
		if hasGroup {
			g := t.GroupLabel(groupBy)
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

func buildTXT(tasks []report.TaskProjection, fields []string, groupBy report.GroupBy) ([]byte, error) {
	fields = report.NormalizeFields(fields)
	var b strings.Builder
	b.WriteString("Tasks report\n")
	b.WriteString(fmt.Sprintf("Generated: %s\n\n", time.Now().UTC().Format(time.RFC3339)))

	prevGroup := ""
	hasGroup := groupBy != report.GroupByNone
	for i := range tasks {
		t := &tasks[i]
		if hasGroup {
			g := t.GroupLabel(groupBy)
			if i == 0 || g != prevGroup {
				b.WriteString(fmt.Sprintf("=== Group (%s): %s ===\n\n", groupBy, g))
				prevGroup = g
			}
		}
		b.WriteString(fmt.Sprintf("--- Task #%d ---\n", t.ID))
		for _, f := range fields {
			b.WriteString(report.FieldHeader(f))
			b.WriteString(": ")
			b.WriteString(t.Cell(f))
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

func buildPDF(tasks []report.TaskProjection, fields []string, groupBy report.GroupBy, layout report.PDFLayout) ([]byte, error) {
	fields = report.NormalizeFields(fields)
	pdf := fpdf.New("L", "mm", "A4", "")
	pdffonts.RegisterUTF8Fonts(pdf)
	pdf.SetTitle("Tasks report", true)

	if layout != report.PDFLayoutList {
		layout = report.PDFLayoutTable
	}

	if layout == report.PDFLayoutList {
		buildPDFList(pdf, tasks, fields, groupBy)
	} else {
		buildPDFTable(pdf, tasks, fields, groupBy)
	}

	var buf bytes.Buffer
	err := pdf.Output(&buf)
	return buf.Bytes(), err
}

func buildPDFTable(pdf *fpdf.Fpdf, tasks []report.TaskProjection, fields []string, groupBy report.GroupBy) {
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
	hasGroup := groupBy != report.GroupByNone
	for i := range tasks {
		t := &tasks[i]
		if hasGroup {
			g := t.GroupLabel(groupBy)
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

func buildPDFList(pdf *fpdf.Fpdf, tasks []report.TaskProjection, fields []string, groupBy report.GroupBy) {
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
	hasGroup := groupBy != report.GroupByNone
	for i := range tasks {
		t := &tasks[i]
		if hasGroup {
			g := t.GroupLabel(groupBy)
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
			line := report.FieldHeader(f) + ": " + pdfSafe(t.Cell(f))
			pdf.MultiCell(usable, lineH, line, "", "L", false)
		}
		pdf.Ln(4)
	}
}
