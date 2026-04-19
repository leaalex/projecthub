package report

// ID — идентификатор сохранённого отчёта.
type ID uint

func (id ID) Uint() uint { return uint(id) }
