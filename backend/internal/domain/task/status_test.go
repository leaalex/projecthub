package task

import "testing"

func TestParseStatus(t *testing.T) {
	for _, raw := range []string{"todo", "TODO", " in_progress ", "review", "done"} {
		st, err := ParseStatus(raw)
		if err != nil {
			t.Fatalf("ParseStatus(%q): %v", raw, err)
		}
		if !st.IsValid() {
			t.Fatalf("expected valid: %q -> %s", raw, st)
		}
	}
	if _, err := ParseStatus("nope"); err == nil {
		t.Fatal("expected error")
	}
}

func TestStatusString(t *testing.T) {
	if StatusTodo.String() != "todo" {
		t.Fatal(StatusTodo.String())
	}
}
