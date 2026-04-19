package report

import "strings"

// PDFLayout — режим вёрстки PDF.
type PDFLayout string

const (
	PDFLayoutTable PDFLayout = "table"
	PDFLayoutList  PDFLayout = "list"
)

// ParsePDFLayout парсит строку; пустая строка → PDFLayoutTable.
func ParsePDFLayout(s string) (PDFLayout, error) {
	v := strings.ToLower(strings.TrimSpace(s))
	if v == "" {
		return PDFLayoutTable, nil
	}
	switch PDFLayout(v) {
	case PDFLayoutTable, PDFLayoutList:
		return PDFLayout(v), nil
	default:
		return "", ErrInvalidLayout
	}
}

func (l PDFLayout) String() string { return string(l) }
