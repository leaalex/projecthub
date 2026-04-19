package report

import "context"

// Repository — персистентность агрегата SavedReport.
type Repository interface {
	FindByID(ctx context.Context, id ID) (*SavedReport, error)
	Save(ctx context.Context, r *SavedReport) error
	Delete(ctx context.Context, id ID) error
	ListForCaller(ctx context.Context, callerID uint, callerIsSystem bool) ([]*SavedReport, error)
}
