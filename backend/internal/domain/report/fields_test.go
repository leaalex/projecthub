package report

import "testing"

func TestNormalizeFields_default(t *testing.T) {
	got := NormalizeFields(nil)
	if len(got) != len(defaultReportFields) {
		t.Fatalf("len %d", len(got))
	}
}

func TestNormalizeFields_dedup(t *testing.T) {
	got := NormalizeFields([]string{"title", "TITLE", "status"})
	if len(got) != 2 || got[0] != FieldTitle || got[1] != FieldStatus {
		t.Fatalf("%v", got)
	}
}
