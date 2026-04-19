package task

import "testing"

func TestParsePriority(t *testing.T) {
	for _, raw := range []string{"low", "MEDIUM", " high", "critical"} {
		p, err := ParsePriority(raw)
		if err != nil {
			t.Fatalf("ParsePriority(%q): %v", raw, err)
		}
		if !p.IsValid() {
			t.Fatalf("expected valid: %q -> %s", raw, p)
		}
	}
	if _, err := ParsePriority("invalid"); err == nil {
		t.Fatal("expected error")
	}
}
