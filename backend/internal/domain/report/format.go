package report

import (
	"strings"
)

// Format — формат экспорта отчёта.
type Format string

const (
	FormatCSV  Format = "csv"
	FormatXLSX Format = "xlsx"
	FormatPDF  Format = "pdf"
	FormatTXT  Format = "txt"
)

// ParseFormat нормализует и валидирует строку формата.
func ParseFormat(s string) (Format, error) {
	f := Format(strings.ToLower(strings.TrimSpace(s)))
	switch f {
	case FormatCSV, FormatXLSX, FormatPDF, FormatTXT:
		return f, nil
	default:
		return "", ErrInvalidFormat
	}
}

func (f Format) String() string { return string(f) }

// Ext — расширение файла с точкой.
func (f Format) Ext() string {
	switch f {
	case FormatCSV:
		return ".csv"
	case FormatXLSX:
		return ".xlsx"
	case FormatPDF:
		return ".pdf"
	case FormatTXT:
		return ".txt"
	default:
		return ".bin"
	}
}

// MIME — Content-Type для HTTP.
func (f Format) MIME() string {
	switch strings.ToLower(string(f)) {
	case string(FormatCSV):
		return "text/csv; charset=utf-8"
	case string(FormatXLSX):
		return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
	case string(FormatPDF):
		return "application/pdf"
	case string(FormatTXT):
		return "text/plain; charset=utf-8"
	default:
		return "application/octet-stream"
	}
}
