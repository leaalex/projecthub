package ordering

import "testing"

func TestBetween_bothNil(t *testing.T) {
	p, ok := Between(nil, nil)
	if !ok || p != Step {
		t.Fatalf("Between(nil,nil) = (%d,%v), want (%d,true)", p, ok, Step)
	}
}

func TestBetween_beforeOnly(t *testing.T) {
	b := int64(2 * Step)
	p, ok := Between(nil, &b)
	if !ok || p != b/2 {
		t.Fatalf("Between(nil,b) = (%d,%v), want (%d,true)", p, ok, b/2)
	}
}

func TestBetween_afterOnly(t *testing.T) {
	a := int64(5 * Step)
	p, ok := Between(&a, nil)
	if !ok || p != a+Step {
		t.Fatalf("Between(a,nil) = (%d,%v), want (%d,true)", p, ok, a+Step)
	}
}

func TestBetween_mid(t *testing.T) {
	a := int64(Step)
	b := int64(3 * Step)
	p, ok := Between(&a, &b)
	want := (a + b) / 2
	if !ok || p != want {
		t.Fatalf("Between(a,b) = (%d,%v), want (%d,true)", p, ok, want)
	}
}

func TestBetween_noRoom(t *testing.T) {
	a := int64(10)
	b := int64(11)
	_, ok := Between(&a, &b)
	if ok {
		t.Fatal("Between adjacent ints should return ok=false")
	}
}

func TestInitialSequence(t *testing.T) {
	got := InitialSequence(3)
	if len(got) != 3 || got[0] != Step || got[1] != 2*Step || got[2] != 3*Step {
		t.Fatalf("InitialSequence(3) = %v", got)
	}
}
