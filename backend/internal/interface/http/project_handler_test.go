package handlers_test

import (
	"fmt"
	"net/http"
	"testing"

	domainuser "task-manager/backend/internal/domain/user"
	"task-manager/backend/internal/testutil"
)

func TestProject_CRUD(t *testing.T) {
	app := testutil.NewTestApp(t)
	owner, pass := app.SeedUserWithPassword(domainuser.RoleCreator, "creator123")
	token, _ := app.Login(owner.Email().String(), pass)

	var projectID float64

	t.Run("create team project", func(t *testing.T) {
		rec, data := app.Do(http.MethodPost, "/api/projects", map[string]any{
			"name": "Alpha",
			"kind": "team",
		}, token)
		if rec.Code != http.StatusCreated {
			t.Fatalf("expected 201, got %d: %v", rec.Code, data)
		}
		p := data["project"].(map[string]any)
		projectID = p["id"].(float64)
		if p["name"] != "Alpha" {
			t.Fatalf("expected name Alpha, got %v", p["name"])
		}
	})

	t.Run("list includes created project", func(t *testing.T) {
		rec, data := app.Do(http.MethodGet, "/api/projects", nil, token)
		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d: %v", rec.Code, data)
		}
		projects := data["projects"].([]any)
		found := false
		for _, item := range projects {
			p := item.(map[string]any)
			if p["id"].(float64) == projectID {
				found = true
				break
			}
		}
		if !found {
			t.Fatalf("created project not in list")
		}
	})

	t.Run("get by id", func(t *testing.T) {
		rec, data := app.Do(http.MethodGet, fmt.Sprintf("/api/projects/%.0f", projectID), nil, token)
		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d: %v", rec.Code, data)
		}
		p := data["project"].(map[string]any)
		if p["id"].(float64) != projectID {
			t.Fatalf("unexpected project id %v", p["id"])
		}
	})

	t.Run("update name", func(t *testing.T) {
		rec, data := app.Do(http.MethodPut, fmt.Sprintf("/api/projects/%.0f", projectID), map[string]any{
			"name":        "Alpha Renamed",
			"description": "updated",
		}, token)
		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d: %v", rec.Code, data)
		}
		p := data["project"].(map[string]any)
		if p["name"] != "Alpha Renamed" {
			t.Fatalf("expected updated name, got %v", p["name"])
		}
	})

	t.Run("delete project", func(t *testing.T) {
		rec, _ := app.Do(http.MethodDelete, fmt.Sprintf("/api/projects/%.0f", projectID), nil, token)
		if rec.Code != http.StatusNoContent {
			t.Fatalf("expected 204, got %d", rec.Code)
		}
	})

	t.Run("get deleted project returns 404", func(t *testing.T) {
		rec, _ := app.Do(http.MethodGet, fmt.Sprintf("/api/projects/%.0f", projectID), nil, token)
		if rec.Code != http.StatusNotFound {
			t.Fatalf("expected 404, got %d", rec.Code)
		}
	})
}

// TestProject_DeleteOrphansTasksBaseline документирует текущее поведение при удалении
// проекта, которому принадлежат задачи.
//
// С момента добавления _foreign_keys=on в SQLite DSN DELETE завершается ошибкой
// нарушения FK-ограничения (tasks.project_id → projects.id имеет NO ACTION).
// Сервис возвращает 500 Internal Server Error.
//
// Ожидаемое поведение после реализации мягкого удаления из
// docs/architecture/aggregates.md:
//   - DELETE /projects/:id мягко удаляет проект (устанавливает DeletedAt).
//   - Задачи остаются в БД и сохраняют свой project_id.
//   - Задачи исключаются из ответов на список, т.к. проект архивирован.
//   - Жёсткое удаление (/projects/:id?permanent=true) каскадно удалит задачи
//     через ProjectDeletionService.
func TestProject_DeleteOrphansTasksBaseline(t *testing.T) {
	app := testutil.NewTestApp(t)
	owner, pass := app.SeedUserWithPassword(domainuser.RoleCreator, "creator123")
	token, _ := app.Login(owner.Email().String(), pass)

	// Создаём проект через API.
	rec, data := app.Do(http.MethodPost, "/api/projects", map[string]any{
		"name": "ToDelete",
		"kind": "team",
	}, token)
	if rec.Code != http.StatusCreated {
		t.Fatalf("create project: expected 201, got %d: %v", rec.Code, data)
	}
	p := data["project"].(map[string]any)
	projectID := uint(p["id"].(float64))

	// Создаём задачи в этом проекте напрямую.
	app.SeedTask(projectID)
	app.SeedTask(projectID)

	before := app.CountTasks(projectID)
	if before != 2 {
		t.Fatalf("expected 2 tasks before deletion, got %d", before)
	}

	// ТЕКУЩЕЕ ПОВЕДЕНИЕ: DELETE завершается ошибкой, т.к. tasks.project_id ссылается на проект,
	// а FK-ограничение имеет NO ACTION (не CASCADE). Сервис возвращает 500.
	//
	// Изменится при реализации мягкого удаления (проект получает DeletedAt вместо
	// физического удаления, поэтому нарушения FK не возникает).
	rec2, _ := app.Do(http.MethodDelete, fmt.Sprintf("/api/projects/%d", projectID), nil, token)
	if rec2.Code != http.StatusInternalServerError {
		t.Fatalf("BASELINE CHANGED: expected 500 (FK constraint) when deleting project with tasks, got %d", rec2.Code)
	}

	// Задачи по-прежнему существуют, т.к. проект НЕ был удалён.
	after := app.CountTasks(projectID)
	if after != 2 {
		t.Fatalf("BASELINE CHANGED: expected 2 tasks to remain (project not deleted), got %d", after)
	}
}

func TestProject_Permissions(t *testing.T) {
	app := testutil.NewTestApp(t)
	owner, ownerPass := app.SeedUserWithPassword(domainuser.RoleCreator, "ownerpass1")
	other, otherPass := app.SeedUserWithPassword(domainuser.RoleUser, "otherpass1")

	ownerToken, _ := app.Login(owner.Email().String(), ownerPass)
	otherToken, _ := app.Login(other.Email().String(), otherPass)

	// Создаём проект от имени владельца.
	rec, data := app.Do(http.MethodPost, "/api/projects", map[string]any{
		"name": "Private",
		"kind": "team",
	}, ownerToken)
	if rec.Code != http.StatusCreated {
		t.Fatalf("create: expected 201, got %d", rec.Code)
	}
	pid := data["project"].(map[string]any)["id"].(float64)

	t.Run("non-member cannot get project", func(t *testing.T) {
		rec, _ := app.Do(http.MethodGet, fmt.Sprintf("/api/projects/%.0f", pid), nil, otherToken)
		if rec.Code != http.StatusForbidden {
			t.Fatalf("expected 403, got %d", rec.Code)
		}
	})

	t.Run("non-member cannot delete project", func(t *testing.T) {
		rec, _ := app.Do(http.MethodDelete, fmt.Sprintf("/api/projects/%.0f", pid), nil, otherToken)
		if rec.Code != http.StatusForbidden {
			t.Fatalf("expected 403, got %d", rec.Code)
		}
	})

	t.Run("unauthenticated cannot list projects", func(t *testing.T) {
		rec, _ := app.Do(http.MethodGet, "/api/projects", nil, "")
		if rec.Code != http.StatusUnauthorized {
			t.Fatalf("expected 401, got %d", rec.Code)
		}
	})

	t.Run("global user cannot create team project", func(t *testing.T) {
		rec, _ := app.Do(http.MethodPost, "/api/projects", map[string]any{
			"name": "UserTeam",
			"kind": "team",
		}, otherToken)
		if rec.Code != http.StatusForbidden {
			t.Fatalf("expected 403, got %d", rec.Code)
		}
	})
}
