package handler_test

import (
	"fmt"
	"net/http"
	"testing"

	domainuser "task-manager/backend/internal/domain/user"
	"task-manager/backend/internal/testutil"
)

func TestTask_Create(t *testing.T) {
	app := testutil.NewTestApp(t)
	owner, pass := app.SeedUserWithPassword(domainuser.RoleCreator, "creator123")
	token, _ := app.Login(owner.Email().String(), pass)

	p := app.SeedProject(owner.ID().Uint(), "team")

	t.Run("create task in project", func(t *testing.T) {
		rec, data := app.Do(http.MethodPost, "/api/tasks", map[string]any{
			"title":      "First task",
			"project_id": p.ID().Uint(),
		}, token)
		if rec.Code != http.StatusCreated {
			t.Fatalf("expected 201, got %d: %v", rec.Code, data)
		}
		task := data["task"].(map[string]any)
		if task["title"] != "First task" {
			t.Fatalf("unexpected title: %v", task["title"])
		}
		if task["status"] != "todo" {
			t.Fatalf("expected default status todo, got %v", task["status"])
		}
	})

	t.Run("missing project_id returns 400", func(t *testing.T) {
		rec, _ := app.Do(http.MethodPost, "/api/tasks", map[string]any{
			"title": "No project",
		}, token)
		if rec.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", rec.Code)
		}
	})
}

func TestTask_GetUpdateDelete(t *testing.T) {
	app := testutil.NewTestApp(t)
	owner, pass := app.SeedUserWithPassword(domainuser.RoleCreator, "creator123")
	token, _ := app.Login(owner.Email().String(), pass)
	p := app.SeedProject(owner.ID().Uint(), "team")
	task := app.SeedTask(p.ID().Uint())

	t.Run("get task", func(t *testing.T) {
		rec, data := app.Do(http.MethodGet, fmt.Sprintf("/api/tasks/%d", task.ID().Uint()), nil, token)
		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d: %v", rec.Code, data)
		}
		got := data["task"].(map[string]any)
		if uint(got["id"].(float64)) != task.ID().Uint() {
			t.Fatalf("unexpected task id")
		}
	})

	t.Run("update title and priority", func(t *testing.T) {
		rec, data := app.Do(http.MethodPut, fmt.Sprintf("/api/tasks/%d", task.ID().Uint()), map[string]any{
			"title":    "Updated title",
			"priority": "high",
		}, token)
		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d: %v", rec.Code, data)
		}
		got := data["task"].(map[string]any)
		if got["title"] != "Updated title" {
			t.Fatalf("unexpected title: %v", got["title"])
		}
		if got["priority"] != "high" {
			t.Fatalf("unexpected priority: %v", got["priority"])
		}
	})

	t.Run("delete task", func(t *testing.T) {
		rec, _ := app.Do(http.MethodDelete, fmt.Sprintf("/api/tasks/%d", task.ID().Uint()), nil, token)
		if rec.Code != http.StatusNoContent {
			t.Fatalf("expected 204, got %d", rec.Code)
		}
	})

	t.Run("get deleted task returns 404", func(t *testing.T) {
		rec, _ := app.Do(http.MethodGet, fmt.Sprintf("/api/tasks/%d", task.ID().Uint()), nil, token)
		if rec.Code != http.StatusNotFound {
			t.Fatalf("expected 404, got %d", rec.Code)
		}
	})
}

func TestTask_Complete(t *testing.T) {
	app := testutil.NewTestApp(t)
	owner, pass := app.SeedUserWithPassword(domainuser.RoleCreator, "creator123")
	token, _ := app.Login(owner.Email().String(), pass)
	p := app.SeedProject(owner.ID().Uint(), "team")
	task := app.SeedTask(p.ID().Uint())

	t.Run("complete sets status to done", func(t *testing.T) {
		rec, data := app.Do(http.MethodPost, fmt.Sprintf("/api/tasks/%d/complete", task.ID().Uint()), nil, token)
		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d: %v", rec.Code, data)
		}
		got := data["task"].(map[string]any)
		if got["status"] != "done" {
			t.Fatalf("expected status done, got %v", got["status"])
		}
	})
}

func TestTask_Assign(t *testing.T) {
	app := testutil.NewTestApp(t)
	owner, ownerPass := app.SeedUserWithPassword(domainuser.RoleCreator, "creator123")
	member := app.SeedUser(domainuser.RoleUser)
	ownerToken, _ := app.Login(owner.Email().String(), ownerPass)

	p := app.SeedProject(owner.ID().Uint(), "team")

	// Добавляем участника в проект через API.
	app.Do(http.MethodPost, fmt.Sprintf("/api/projects/%d/members", p.ID().Uint()), map[string]any{
		"user_id": member.ID().Uint(),
		"role":    "executor",
	}, ownerToken)

	task := app.SeedTask(p.ID().Uint())

	t.Run("assign member", func(t *testing.T) {
		rec, data := app.Do(http.MethodPost, fmt.Sprintf("/api/tasks/%d/assign", task.ID().Uint()), map[string]any{
			"assignee_id": member.ID().Uint(),
		}, ownerToken)
		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d: %v", rec.Code, data)
		}
		got := data["task"].(map[string]any)
		if uint(got["assignee_id"].(float64)) != member.ID().Uint() {
			t.Fatalf("expected assignee_id %d, got %v", member.ID().Uint(), got["assignee_id"])
		}
	})

	t.Run("unassign (assignee_id 0)", func(t *testing.T) {
		rec, data := app.Do(http.MethodPost, fmt.Sprintf("/api/tasks/%d/assign", task.ID().Uint()), map[string]any{
			"assignee_id": 0,
		}, ownerToken)
		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d: %v", rec.Code, data)
		}
		got := data["task"].(map[string]any)
		if got["assignee_id"] != nil {
			t.Fatalf("expected nil assignee_id after unassign, got %v", got["assignee_id"])
		}
	})
}

func TestTask_MoveInProject(t *testing.T) {
	app := testutil.NewTestApp(t)
	owner, pass := app.SeedUserWithPassword(domainuser.RoleCreator, "creator123")
	token, _ := app.Login(owner.Email().String(), pass)
	p := app.SeedProject(owner.ID().Uint(), "team")

	// Создаём две задачи через API для получения валидных ID.
	rec1, d1 := app.Do(http.MethodPost, "/api/tasks", map[string]any{"title": "T1", "project_id": p.ID().Uint()}, token)
	if rec1.Code != http.StatusCreated {
		t.Fatalf("create T1: %d %v", rec1.Code, d1)
	}
	task1ID := uint(d1["task"].(map[string]any)["id"].(float64))

	// Создаём секцию.
	recS, dS := app.Do(http.MethodPost, fmt.Sprintf("/api/projects/%d/sections", p.ID().Uint()), map[string]any{
		"name": "Section A",
	}, token)
	if recS.Code != http.StatusCreated {
		t.Fatalf("create section: %d %v", recS.Code, dS)
	}
	sectionID := uint(dS["section"].(map[string]any)["id"].(float64))

	t.Run("move task into section", func(t *testing.T) {
		pos := 0
		rec, data := app.Do(http.MethodPost, fmt.Sprintf("/api/projects/%d/tasks/move", p.ID().Uint()), map[string]any{
			"task_id":    task1ID,
			"section_id": sectionID,
			"position":   pos,
		}, token)
		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d: %v", rec.Code, data)
		}
		got := data["task"].(map[string]any)
		gotSection := got["section_id"]
		if gotSection == nil {
			t.Fatalf("expected section_id to be set, got nil")
		}
		if uint(gotSection.(float64)) != sectionID {
			t.Fatalf("expected section_id %d, got %v", sectionID, gotSection)
		}
	})

	t.Run("move task out of section (nil section)", func(t *testing.T) {
		rec, data := app.Do(http.MethodPost, fmt.Sprintf("/api/projects/%d/tasks/move", p.ID().Uint()), map[string]any{
			"task_id":    task1ID,
			"section_id": nil,
			"position":   0,
		}, token)
		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d: %v", rec.Code, data)
		}
		got := data["task"].(map[string]any)
		if got["section_id"] != nil {
			t.Fatalf("expected nil section_id after move out, got %v", got["section_id"])
		}
	})
}
