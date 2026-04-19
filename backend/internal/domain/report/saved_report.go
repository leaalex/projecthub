package report

import "time"

// SavedReport — корень агрегата: метаданные файла экспорта на диске.
type SavedReport struct {
	ID          uint      `json:"id"`
	UserID      uint      `json:"user_id"`
	StorageKey  string    `json:"-"`
	DisplayName string    `json:"display_name"`
	Format      string    `json:"format"`
	SizeBytes   int64     `json:"size_bytes"`
	FiltersJSON string    `json:"-"`
	CreatedAt   time.Time `json:"created_at"`
}

// BelongsTo сообщает, принадлежит ли отчёт пользователю.
func (r *SavedReport) BelongsTo(userID uint) bool {
	return r != nil && r.UserID == userID
}

// NewSavedReport создаёт новую запись до сохранения в БД (ID=0).
func NewSavedReport(userID uint, storageKey, displayName string, format Format, sizeBytes int64, filtersJSON string, createdAt time.Time) *SavedReport {
	return &SavedReport{
		UserID:      userID,
		StorageKey:  storageKey,
		DisplayName: displayName,
		Format:      string(format),
		SizeBytes:   sizeBytes,
		FiltersJSON: filtersJSON,
		CreatedAt:   createdAt,
	}
}

// Rehydrate восстанавливает агрегат из персистентности.
func Rehydrate(id uint, userID uint, storageKey, displayName, format string, sizeBytes int64, filtersJSON string, createdAt time.Time) *SavedReport {
	return &SavedReport{
		ID:          id,
		UserID:      userID,
		StorageKey:  storageKey,
		DisplayName: displayName,
		Format:      format,
		SizeBytes:   sizeBytes,
		FiltersJSON: filtersJSON,
		CreatedAt:   createdAt,
	}
}
