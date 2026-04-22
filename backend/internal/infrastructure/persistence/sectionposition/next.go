// Package sectionposition computes ordering positions shared by tasks and notes in a project section.
package sectionposition

import (
	"task-manager/backend/internal/domain/ordering"

	"gorm.io/gorm"
)

// NextMixed returns the next sparse position after all tasks and notes in the given section.
// Empty section returns ordering.Step.
func NextMixed(db *gorm.DB, projectID uint, sectionID *uint) (int, error) {
	var maxT, maxN int64
	tq := db.Table("tasks").Where("project_id = ? AND deleted_at IS NULL", projectID)
	if sectionID == nil {
		tq = tq.Where("section_id IS NULL")
	} else {
		tq = tq.Where("section_id = ?", *sectionID)
	}
	if err := tq.Select("COALESCE(MAX(position), 0)").Scan(&maxT).Error; err != nil {
		return 0, err
	}
	nq := db.Table("notes").Where("project_id = ? AND deleted_at IS NULL", projectID)
	if sectionID == nil {
		nq = nq.Where("section_id IS NULL")
	} else {
		nq = nq.Where("section_id = ?", *sectionID)
	}
	if err := nq.Select("COALESCE(MAX(position), 0)").Scan(&maxN).Error; err != nil {
		return 0, err
	}
	maxPos := maxT
	if maxN > maxPos {
		maxPos = maxN
	}
	if maxPos == 0 {
		return int(ordering.Step), nil
	}
	return int(maxPos + ordering.Step), nil
}
