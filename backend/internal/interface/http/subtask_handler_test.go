package handler_test

import (
	"fmt"
	"net/http"
	"testing"

	domainuser "task-manager/backend/internal/domain/user"
	"task-manager/backend/internal/testutil"
)

func TestSubtask_CRUD(t *testing.T) {
	app := testutil.NewTestApp(t)
	owner, pass := app.SeedUserWithPassword(domainuser.RoleCreator, "creator123")
	token, _ := app.Login(owner.Email().String(), pass)
	p := app.SeedProject(owner.ID().Uint(), "team")
	task := app.SeedTask(p.ID().Uint())

	var subtaskID float64

	t.Run("create subtask", func(t *testing.T) {
		rec, data := app.Do(http.MethodPost, fmt.Sprintf("/api/tasks/%d/subtasks", task.ID().Uint()), map[string]any{
			"title": "Sub one",
		}, token)
		if rec.Code != http.StatusCreated {
			t.Fatalf("expected 201, got %d: %v", rec.Code, data)
		}
		s := data["subtask"].(map[string]any)
		subtaskID = s["id"].(float64)
		if s["title"] != "Sub one" {
			t.Fatalf("unexpected title: %v", s["title"])
		}
		if s["done"].(bool) {
			t.Fatalf("new subtask should not be done")
		}
	})

	t.Run("list subtasks", func(t *testing.T) {
		rec, data := app.Do(http.MethodGet, fmt.Sprintf("/api/tasks/%d/subtasks", task.ID().Uint()), nil, token)
		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d: %v", rec.Code, data)
		}
		subs := data["subtasks"].([]any)
		if len(subs) == 0 {
			t.Fatalf("expected at least one subtask")
		}
	})

	t.Run("toggle subtask done", func(t *testing.T) {
		rec, data := app.Do(http.MethodPost,
			fmt.Sprintf("/api/tasks/%d/subtasks/%.0f/toggle", task.ID().Uint(), subtaskID), nil, token)
		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d: %v", rec.Code, data)
		}
		s := data["subtask"].(map[string]any)
		if !s["done"].(bool) {
			t.Fatalf("expected subtask to be done after toggle")
		}
	})

	t.Run("update subtask title", func(t *testing.T) {
		rec, data := app.Do(http.MethodPut,
			fmt.Sprintf("/api/tasks/%d/subtasks/%.0f", task.ID().Uint(), subtaskID),
			map[string]any{"title": "Sub one renamed"}, token)
		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d: %v", rec.Code, data)
		}
		s := data["subtask"].(map[string]any)
		if s["title"] != "Sub one renamed" {
			t.Fatalf("unexpected title: %v", s["title"])
		}
	})

	t.Run("delete subtask", func(t *testing.T) {
		rec, _ := app.Do(http.MethodDelete,
			fmt.Sprintf("/api/tasks/%d/subtasks/%.0f", task.ID().Uint(), subtaskID), nil, token)
		if rec.Code != http.StatusNoContent {
			t.Fatalf("expected 204, got %d", rec.Code)
		}
	})

	t.Run("subtask list is empty after delete", func(t *testing.T) {
		rec, data := app.Do(http.MethodGet, fmt.Sprintf("/api/tasks/%d/subtasks", task.ID().Uint()), nil, token)
		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d", rec.Code)
		}
		subs := data["subtasks"].([]any)
		if len(subs) != 0 {
			t.Fatalf("expected empty subtasks list, got %d items", len(subs))
		}
	})
}

// TestSubtask_CascadeOnTaskDelete проверяет, что подзадачи физически удаляются
// при удалении родительской задачи (FK ON DELETE CASCADE в схеме subtasks).
func TestSubtask_CascadeOnTaskDelete(t *testing.T) {
	app := testutil.NewTestApp(t)
	owner, pass := app.SeedUserWithPassword(domainuser.RoleCreator, "creator123")
	token, _ := app.Login(owner.Email().String(), pass)
	p := app.SeedProject(owner.ID().Uint(), "team")
	task := app.SeedTask(p.ID().Uint())

	// Создаём подзадачи.
	app.Do(http.MethodPost, fmt.Sprintf("/api/tasks/%d/subtasks", task.ID().Uint()), map[string]any{"title": "S1"}, token)
	app.Do(http.MethodPost, fmt.Sprintf("/api/tasks/%d/subtasks", task.ID().Uint()), map[string]any{"title": "S2"}, token)

	// Проверяем, что подзадачи существуют.
	if countBefore := app.CountSubtasks(task.ID().Uint()); countBefore != 2 {
		t.Fatalf("expected 2 subtasks before task deletion, got %d", countBefore)
	}

	// Удаляем родительскую задачу.
	rec, _ := app.Do(http.MethodDelete, fmt.Sprintf("/api/tasks/%d", task.ID().Uint()), nil, token)
	if rec.Code != http.StatusNoContent {
		t.Fatalf("delete task: expected 204, got %d", rec.Code)
	}

	// Подзадачи должны быть удалены (CASCADE).
	if countAfter := app.CountSubtasks(task.ID().Uint()); countAfter != 0 {
		t.Fatalf("expected 0 subtasks after task deletion (CASCADE), got %d", countAfter)
	}
}
