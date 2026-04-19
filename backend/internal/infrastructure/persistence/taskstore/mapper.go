package taskstore

import (
	"fmt"

	"task-manager/backend/internal/domain/project"
	"task-manager/backend/internal/domain/task"
	"task-manager/backend/internal/domain/user"
)

func recordToDomain(tr *TaskRecord, subRows []SubtaskRecord) (*task.Task, error) {
	st, err := task.ParseStatus(tr.Status)
	if err != nil {
		return nil, fmt.Errorf("task %d: %w", tr.ID, err)
	}
	pr, err := task.ParsePriority(tr.Priority)
	if err != nil {
		return nil, fmt.Errorf("task %d: %w", tr.ID, err)
	}
	var secID *project.SectionID
	if tr.SectionID != nil {
		s := project.SectionID(*tr.SectionID)
		secID = &s
	}
	var assignee *user.ID
	if tr.AssigneeID != nil {
		u := user.ID(*tr.AssigneeID)
		assignee = &u
	}
	subs := make([]*task.Subtask, 0, len(subRows))
	for i := range subRows {
		sr := &subRows[i]
		subs = append(subs, task.ReconstituteSubtask(
			task.SubtaskID(sr.ID),
			sr.Title,
			sr.Done,
			sr.Position,
			sr.CreatedAt,
			sr.UpdatedAt,
		))
	}
	return task.Reconstitute(
		task.ID(tr.ID),
		project.ID(tr.ProjectID),
		secID,
		assignee,
		tr.Title,
		tr.Description,
		st,
		pr,
		tr.Position,
		tr.DueDate,
		subs,
		tr.CreatedAt,
		tr.UpdatedAt,
	), nil
}

func taskToRecord(t *task.Task) TaskRecord {
	var sec *uint
	if sid := t.SectionID(); sid != nil {
		v := sid.Uint()
		sec = &v
	}
	var assignee *uint
	if aid := t.AssigneeID(); aid != nil {
		v := aid.Uint()
		assignee = &v
	}
	return TaskRecord{
		ID:          t.ID().Uint(),
		Title:       t.Title(),
		Description: t.Description(),
		Status:      t.Status().String(),
		Priority:    t.Priority().String(),
		ProjectID:   t.ProjectID().Uint(),
		SectionID:   sec,
		Position:    t.Position(),
		AssigneeID:  assignee,
		DueDate:     t.DueDate(),
		CreatedAt:   t.CreatedAt(),
		UpdatedAt:   t.UpdatedAt(),
	}
}

func subtaskToRecord(taskID uint, s *task.Subtask) SubtaskRecord {
	return SubtaskRecord{
		ID:        s.ID().Uint(),
		TaskID:    taskID,
		Title:     s.Title(),
		Done:      s.Done(),
		Position:  s.Position(),
		CreatedAt: s.CreatedAt(),
		UpdatedAt: s.UpdatedAt(),
	}
}
