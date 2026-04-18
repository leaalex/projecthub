package user

// ID — идентификатор пользователя в хранилище.
type ID uint

func (id ID) Uint() uint {
	return uint(id)
}
