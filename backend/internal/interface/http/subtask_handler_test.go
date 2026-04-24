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

func TestSubtask_Reorder(t *testing.T) {
	app := testutil.NewTestApp(t)
	owner, pass := app.SeedUserWithPassword(domainuser.RoleCreator, "creator123")
	token, _ := app.Login(owner.Email().String(), pass)
	p := app.SeedProject(owner.ID().Uint(), "team")
	task := app.SeedTask(p.ID().Uint())

	var id1, id2, id3 uint
	for i, title := range []string{"A", "B", "C"} {
		rec, data := app.Do(http.MethodPost, fmt.Sprintf("/api/tasks/%d/subtasks", task.ID().Uint()), map[string]any{
			"title": title,
		}, token)
		if rec.Code != http.StatusCreated {
			t.Fatalf("subtask %d: %d %v", i, rec.Code, data)
		}
		sid := uint(data["subtask"].(map[string]any)["id"].(float64))
		switch i {
		case 0:
			id1 = sid
		case 1:
			id2 = sid
		case 2:
			id3 = sid
		}
	}

	t.Run("reorder 3,1,2", func(t *testing.T) {
		rec, _ := app.Do(http.MethodPost, fmt.Sprintf("/api/tasks/%d/subtasks/reorder", task.ID().Uint()), map[string]any{
			"subtask_ids": []uint{id3, id1, id2},
		}, token)
		if rec.Code != http.StatusNoContent {
			t.Fatalf("expected 204, got %d", rec.Code)
		}
		rec2, data := app.Do(http.MethodGet, fmt.Sprintf("/api/tasks/%d/subtasks", task.ID().Uint()), nil, token)
		if rec2.Code != http.StatusOK {
			t.Fatalf("list: %d %v", rec2.Code, data)
		}
		subs := data["subtasks"].([]any)
		if len(subs) != 3 {
			t.Fatalf("len: %d", len(subs))
		}
		// list order = position; first item should be C (id3)
		first := subs[0].(map[string]any)
		if uint(first["id"].(float64)) != id3 {
			t.Fatalf("first id: got %v want %d", first["id"], id3)
		}
		if int(first["position"].(float64)) != 1 {
			t.Fatalf("first position: %v", first["position"])
		}
	})

	t.Run("invalid reorder (incomplete list)", func(t *testing.T) {
		rec, data := app.Do(http.MethodPost, fmt.Sprintf("/api/tasks/%d/subtasks/reorder", task.ID().Uint()), map[string]any{
			"subtask_ids": []uint{id1, id2},
		}, token)
		if rec.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d: %v", rec.Code, data)
		}
	})

	member, memberPass := app.SeedUserWithPassword(domainuser.RoleUser, "member123")
	app.Do(http.MethodPost, fmt.Sprintf("/api/projects/%d/members", p.ID().Uint()), map[string]any{
		"user_id": member.ID().Uint(),
		"role":    "executor",
	}, token)
	memberToken, _ := app.Login(member.Email().String(), memberPass)

	t.Run("executor forbidden", func(t *testing.T) {
		rec, data := app.Do(http.MethodPost, fmt.Sprintf("/api/tasks/%d/subtasks/reorder", task.ID().Uint()), map[string]any{
			"subtask_ids": []uint{id1, id2, id3},
		}, memberToken)
		if rec.Code != http.StatusForbidden {
			t.Fatalf("expected 403, got %d: %v", rec.Code, data)
		}
	})
}

// TestSubtask_CascadeOnTaskHardDelete проверяет, что подзадачи физически удаляются
// при жёстком удалении родительской задачи.
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

	// Мягкое удаление: задача уходит в корзину, подзадачи сохраняются.
	rec, _ := app.Do(http.MethodDelete, fmt.Sprintf("/api/tasks/%d", task.ID().Uint()), nil, token)
	if rec.Code != http.StatusNoContent {
		t.Fatalf("soft-delete task: expected 204, got %d", rec.Code)
	}
	if countAfterSoft := app.CountSubtasks(task.ID().Uint()); countAfterSoft != 2 {
		t.Fatalf("expected subtasks to survive soft-delete, got %d", countAfterSoft)
	}

	// Жёсткое удаление через корзину: подзадачи должны исчезнуть.
	rec2, _ := app.Do(http.MethodDelete, fmt.Sprintf("/api/tasks/%d?permanent=true", task.ID().Uint()), nil, token)
	if rec2.Code != http.StatusNoContent {
		t.Fatalf("hard-delete task: expected 204, got %d: %v", rec2.Code, rec2.Body.String())
	}
	if countAfter := app.CountSubtasks(task.ID().Uint()); countAfter != 0 {
		t.Fatalf("expected 0 subtasks after hard-delete (CASCADE), got %d", countAfter)
	}
}
