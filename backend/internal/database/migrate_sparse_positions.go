package database

import (
	"fmt"
	"sort"

	"task-manager/backend/internal/domain/ordering"
	"task-manager/backend/internal/infrastructure/persistence/notestore"
	"task-manager/backend/internal/infrastructure/persistence/taskstore"

	"gorm.io/gorm"
)

const sparsePositionsMigrationName = "sparse_positions_v1"

type sparseRow struct {
	kind       string // "task" | "note"
	id         uint
	projectID  uint
	sectionID  *uint
	position   int
}

type sparseGroupKey struct {
	projectID uint
	sectionID *uint
}

func migrateSparsePositions(db *gorm.DB) error {
	if err := db.Exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
		name TEXT PRIMARY KEY,
		applied INTEGER NOT NULL DEFAULT 1
	)`).Error; err != nil {
		return err
	}
	var cnt int64
	if err := db.Raw("SELECT COUNT(*) FROM schema_migrations WHERE name = ?", sparsePositionsMigrationName).Scan(&cnt).Error; err != nil {
		return err
	}
	if cnt > 0 {
		return nil
	}

	return db.Transaction(func(tx *gorm.DB) error {
		var tasks []taskstore.TaskRecord
		if err := tx.Model(&taskstore.TaskRecord{}).Where("deleted_at IS NULL").Find(&tasks).Error; err != nil {
			return err
		}
		var notes []notestore.NoteRecord
		if err := tx.Model(&notestore.NoteRecord{}).Where("deleted_at IS NULL").Find(&notes).Error; err != nil {
			return err
		}

		byKey := make(map[sparseGroupKey][]sparseRow)
		for _, t := range tasks {
			k := sparseGroupKey{projectID: t.ProjectID, sectionID: t.SectionID}
			byKey[k] = append(byKey[k], sparseRow{
				kind: "task", id: t.ID, projectID: t.ProjectID, sectionID: t.SectionID, position: t.Position,
			})
		}
		for _, n := range notes {
			k := sparseGroupKey{projectID: n.ProjectID, sectionID: n.SectionID}
			byKey[k] = append(byKey[k], sparseRow{
				kind: "note", id: n.ID, projectID: n.ProjectID, sectionID: n.SectionID, position: n.Position,
			})
		}

		for _, rows := range byKey {
			sort.SliceStable(rows, func(i, j int) bool {
				if rows[i].position != rows[j].position {
					return rows[i].position < rows[j].position
				}
				if rows[i].id != rows[j].id {
					return rows[i].id < rows[j].id
				}
				return rows[i].kind < rows[j].kind
			})
			seq := ordering.InitialSequence(len(rows))
			for i := range rows {
				pos := int(seq[i])
				switch rows[i].kind {
				case "task":
					if err := tx.Model(&taskstore.TaskRecord{}).Where("id = ?", rows[i].id).
						Update("position", pos).Error; err != nil {
						return err
					}
				case "note":
					if err := tx.Model(&notestore.NoteRecord{}).Where("id = ?", rows[i].id).
						Update("position", pos).Error; err != nil {
						return err
					}
				default:
					return fmt.Errorf("sparse migration: unknown kind %q", rows[i].kind)
				}
			}
		}

		return tx.Exec("INSERT INTO schema_migrations (name) VALUES (?)", sparsePositionsMigrationName).Error
	})
}
