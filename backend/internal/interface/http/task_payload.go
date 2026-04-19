package handler

import (
	"time"

	"task-manager/backend/internal/application"
	"task-manager/backend/internal/domain/project"
	"task-manager/backend/internal/domain/task"
	"task-manager/backend/internal/domain/user"

	"github.com/gin-gonic/gin"
)

func subtaskToJSON(s *task.Subtask) gin.H {
	if s == nil {
		return nil
	}
	return gin.H{
		"id":         s.ID().Uint(),
		"title":      s.Title(),
		"done":       s.Done(),
		"position":   s.Position(),
		"created_at": s.CreatedAt(),
		"updated_at": s.UpdatedAt(),
	}
}

// taskToJSON сериализует задачу; section и projectIDForSection — для вложенного объекта section (список задач проекта).
func taskToJSON(t *task.Task, section *project.Section, projectIDForSection uint, assignee *user.User, acl application.TaskCallerACL) gin.H {
	if t == nil {
		return nil
	}
	var secID *uint
	if sid := t.SectionID(); sid != nil {
		v := sid.Uint()
		secID = &v
	}
	var assigneeID *uint
	if aid := t.AssigneeID(); aid != nil {
		v := aid.Uint()
		assigneeID = &v
	}
	var due *time.Time
	if d := t.DueDate(); d != nil {
		due = d
	}
	subs := make([]gin.H, 0, len(t.Subtasks()))
	for _, st := range t.Subtasks() {
		if st != nil {
			subs = append(subs, subtaskToJSON(st))
		}
	}
	out := gin.H{
		"id":                       t.ID().Uint(),
		"title":                    t.Title(),
		"description":              t.Description(),
		"status":                   t.Status().String(),
		"priority":                 t.Priority().String(),
		"project_id":               t.ProjectID().Uint(),
		"section_id":               secID,
		"position":                 t.Position(),
		"assignee_id":              assigneeID,
		"due_date":                 due,
		"subtasks":                 subs,
		"created_at":               t.CreatedAt(),
		"updated_at":               t.UpdatedAt(),
		"caller_can_manage":        acl.CanManage,
		"caller_can_change_status": acl.CanChangeStatus,
	}
	if section != nil {
		out["section"] = gin.H{
			"id":         section.ID().Uint(),
			"project_id": projectIDForSection,
			"name":       section.Name(),
			"position":   section.Position(),
			"created_at": section.CreatedAt(),
			"updated_at": section.UpdatedAt(),
		}
	}
	if assignee != nil {
		out["assignee"] = userPublic(assignee)
	}
	return out
}
