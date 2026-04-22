// Package ordering provides sparse integer positions for ordered lists (tasks + notes in a section).
package ordering

// Step is the gap between consecutive items after a full rebalance.
const Step int64 = 1 << 20 // 1_048_576

// Between returns a position strictly between a and b (when both are set).
// If a is nil, the new position is before b (strictly less than b when b > 0).
// If b is nil, the new position is after a (a + Step).
// If both are nil, returns Step (first item in an empty list).
// ok is false when a and b are both non-nil and b-a <= 1 (no integer midpoint); caller must rebalance.
func Between(a, b *int64) (pos int64, ok bool) {
	switch {
	case a == nil && b == nil:
		return Step, true
	case a == nil && b != nil:
		if *b <= 1 {
			return 0, false
		}
		return *b / 2, true
	case a != nil && b == nil:
		return *a + Step, true
	default:
		// a != nil && b != nil
		if *b-*a <= 1 {
			return 0, false
		}
		return (*a + *b) / 2, true
	}
}

// InitialSequence returns positions Step, 2*Step, … for n items (1-based indexing in loop).
func InitialSequence(n int) []int64 {
	if n <= 0 {
		return nil
	}
	out := make([]int64, n)
	for i := range out {
		out[i] = int64(i+1) * Step
	}
	return out
}
