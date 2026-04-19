package report

import "strings"

// GroupBy — группировка строк в экспорте.
type GroupBy string

const (
	GroupByNone     GroupBy = ""
	GroupByProject  GroupBy = "project"
	GroupByStatus   GroupBy = "status"
	GroupByPriority GroupBy = "priority"
	GroupByAssignee GroupBy = "assignee"
)

// ParseGroupBy парсит строку группировки.
func ParseGroupBy(s string) (GroupBy, error) {
	g := GroupBy(strings.ToLower(strings.TrimSpace(s)))
	switch g {
	case GroupByNone, GroupByProject, GroupByStatus, GroupByPriority, GroupByAssignee:
		return g, nil
	default:
		return "", ErrInvalidGroupBy
	}
}

func (g GroupBy) String() string { return string(g) }
