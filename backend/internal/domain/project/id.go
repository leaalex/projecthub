package project

// ID — идентификатор проекта в хранилище.
type ID uint

func (id ID) Uint() uint { return uint(id) }

// MemberID — идентификатор строки project_members.
type MemberID uint

func (id MemberID) Uint() uint { return uint(id) }

// SectionID — идентификатор строки task_sections.
type SectionID uint

func (id SectionID) Uint() uint { return uint(id) }

// NoteSectionID — идентификатор строки note_sections.
type NoteSectionID uint

func (id NoteSectionID) Uint() uint { return uint(id) }
