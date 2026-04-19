package note

// ID — идентификатор заметки в хранилище.
type ID uint

func (id ID) Uint() uint { return uint(id) }
