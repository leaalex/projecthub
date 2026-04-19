package report

import (
	"strings"
	"testing"
)

func TestParseFormat(t *testing.T) {
	for _, tc := range []struct {
		in   string
		want Format
	}{
		{"csv", FormatCSV},
		{" PDF ", FormatPDF},
		{"XLSX", FormatXLSX},
	} {
		got, err := ParseFormat(tc.in)
		if err != nil || got != tc.want {
			t.Fatalf("ParseFormat(%q) = %v, %v want %v, nil", tc.in, got, err, tc.want)
		}
	}
	if _, err := ParseFormat("doc"); err == nil {
		t.Fatal("expected error")
	}
}

func TestFormatMIME(t *testing.T) {
	if !strings.HasPrefix(FormatCSV.MIME(), "text/csv") {
		t.Fatal(FormatCSV.MIME())
	}
}
