package report

import (
	"time"

	"task-manager/backend/internal/domain/task"
)

// GenerateParams — параметры генерации экспорта (снимок после разбора запроса).
type GenerateParams struct {
	Format     Format
	DateFrom   *time.Time
	DateTo     *time.Time
	ProjectIDs []uint
	UserIDs    []uint
	Statuses   []task.Status
	Priorities []task.Priority
	Fields     []string
	GroupBy    GroupBy
	PDFLayout  PDFLayout
}

// Validate проверяет инварианты параметров.
func (p *GenerateParams) Validate() error {
	if _, err := ParseFormat(string(p.Format)); err != nil {
		return err
	}
	if _, err := ParseGroupBy(string(p.GroupBy)); err != nil {
		return err
	}
	if _, err := ParsePDFLayout(string(p.PDFLayout)); err != nil {
		return err
	}
	for _, st := range p.Statuses {
		if !st.IsValid() {
			return ErrInvalidFields
		}
	}
	for _, pr := range p.Priorities {
		if !pr.IsValid() {
			return ErrInvalidFields
		}
	}
	return nil
}
