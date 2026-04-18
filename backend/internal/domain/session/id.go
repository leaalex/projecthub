package session

type ID uint

func (id ID) Uint() uint {
	if id == 0 {
		return 0
	}
	return uint(id)
}
