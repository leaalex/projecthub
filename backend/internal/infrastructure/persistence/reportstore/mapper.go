package reportstore

import "task-manager/backend/internal/domain/report"

func toDomain(rec *SavedReportRecord) *report.SavedReport {
	if rec == nil {
		return nil
	}
	return report.Rehydrate(
		rec.ID,
		rec.UserID,
		rec.StorageKey,
		rec.DisplayName,
		rec.Format,
		rec.SizeBytes,
		rec.FiltersJSON,
		rec.CreatedAt,
	)
}

func fromDomain(r *report.SavedReport) SavedReportRecord {
	if r == nil {
		return SavedReportRecord{}
	}
	return SavedReportRecord{
		ID:          r.ID,
		UserID:      r.UserID,
		StorageKey:  r.StorageKey,
		DisplayName: r.DisplayName,
		Format:      r.Format,
		SizeBytes:   r.SizeBytes,
		FiltersJSON: r.FiltersJSON,
		CreatedAt:   r.CreatedAt,
	}
}
