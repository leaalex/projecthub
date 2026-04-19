package report

import "errors"

var (
	ErrNotFound        = errors.New("saved report not found")
	ErrInvalidFormat   = errors.New("invalid report format")
	ErrInvalidLayout   = errors.New("invalid pdf layout")
	ErrInvalidGroupBy  = errors.New("invalid group by")
	ErrInvalidFields   = errors.New("invalid task status or priority in report filters")
	ErrReportsDirUnset = errors.New("reports directory not configured")
)
