package user

import "strings"

// FullName — ФИО + устаревшее поле «имя одной строкой» (legacy Name в БД).
type FullName struct {
	LastName   string
	FirstName  string
	Patronymic string
	Legacy     string
}

// WithLegacy возвращает копию с обновлённым legacy-полем.
func (n FullName) WithLegacy(name string) FullName {
	n2 := n
	n2.Legacy = strings.TrimSpace(name)
	return n2
}

// DisplayName возвращает «Фамилия Имя Отчество», если есть хотя бы одна часть ФИО, иначе Legacy.
func (n FullName) DisplayName() string {
	parts := make([]string, 0, 3)
	for _, s := range []string{
		strings.TrimSpace(n.LastName),
		strings.TrimSpace(n.FirstName),
		strings.TrimSpace(n.Patronymic),
	} {
		if s != "" {
			parts = append(parts, s)
		}
	}
	if len(parts) > 0 {
		return strings.Join(parts, " ")
	}
	return strings.TrimSpace(n.Legacy)
}

// SyncLegacyName присваивает Legacy результату DisplayName (когда ФИО пусты — остаётся старый Legacy).
func (n *FullName) SyncLegacyName() {
	n.Legacy = n.DisplayName()
}
