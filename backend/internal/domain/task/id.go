package task

// ID — идентификатор задачи в хранилище.
type ID uint

func (id ID) Uint() uint { return uint(id) }

// SubtaskID — идентификатор подзадачи.
type SubtaskID uint

func (id SubtaskID) Uint() uint { return uint(id) }
