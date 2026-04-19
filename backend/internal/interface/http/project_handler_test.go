package handler_test

import (
	"fmt"
	"net/http"
	"testing"

	domainuser "task-manager/backend/internal/domain/user"
	"task-manager/backend/internal/infrastructure/persistence/notestore"
	"task-manager/backend/internal/infrastructure/persistence/projectstore"
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
// Soft-delete проекта: DELETE /projects/:id без FK-ошибки; задачи остаются в БД,
// но не попадают в список /api/tasks. Жёсткое удаление ?permanent=true каскадно
// удаляет задачи через ProjectDeletionService.
func TestProject_DeleteOrphansTasksBaseline(t *testing.T) {
	app := testutil.NewTestApp(t)
	owner, pass := app.SeedUserWithPassword(domainuser.RoleCreator, "creator123")
	token, _ := app.Login(owner.Email().String(), pass)

	rec, data := app.Do(http.MethodPost, "/api/projects", map[string]any{
		"name": "ToDelete",
		"kind": "team",
	}, token)
	if rec.Code != http.StatusCreated {
		t.Fatalf("create project: expected 201, got %d: %v", rec.Code, data)
	}
	p := data["project"].(map[string]any)
	projectID := uint(p["id"].(float64))

	tk := app.SeedTask(projectID)
	app.SeedTask(projectID)

	// Заметка, секция заметок и связь note↔task — проверяем каскад при permanent delete.
	recSec, dSec := app.Do(http.MethodPost, fmt.Sprintf("/api/projects/%d/sections", projectID), map[string]any{
		"name": "NotesSec",
	}, token)
	if recSec.Code != http.StatusCreated {
		t.Fatalf("section: expected 201, got %d: %v", recSec.Code, dSec)
	}
	secID := uint(dSec["section"].(map[string]any)["id"].(float64))
	recN, dN := app.Do(http.MethodPost, fmt.Sprintf("/api/projects/%d/notes", projectID), map[string]any{
		"title":      "Linked note",
		"section_id": secID,
	}, token)
	if recN.Code != http.StatusCreated {
		t.Fatalf("note: expected 201, got %d: %v", recN.Code, dN)
	}
	noteID := uint(dN["note"].(map[string]any)["id"].(float64))
	recL, _ := app.Do(http.MethodPost, fmt.Sprintf("/api/projects/%d/notes/%d/links", projectID, noteID), map[string]any{
		"task_id": tk.ID().Uint(),
	}, token)
	if recL.Code != http.StatusNoContent {
		t.Fatalf("link note-task: expected 204, got %d", recL.Code)
	}

	before := app.CountTasks(projectID)
	if before != 2 {
		t.Fatalf("expected 2 tasks before deletion, got %d", before)
	}

	rec2, _ := app.Do(http.MethodDelete, fmt.Sprintf("/api/projects/%d", projectID), nil, token)
	if rec2.Code != http.StatusNoContent {
		t.Fatalf("expected 204 soft-delete, got %d", rec2.Code)
	}

	if app.CountTasks(projectID) != 2 {
		t.Fatalf("expected 2 tasks still in DB after soft-delete")
	}

	recList, listData := app.Do(http.MethodGet, fmt.Sprintf("/api/tasks?project_id=%d", projectID), nil, token)
	if recList.Code != http.StatusOK {
		t.Fatalf("list tasks: %d", recList.Code)
	}
	tasks := listData["tasks"].([]any)
	if len(tasks) != 0 {
		t.Fatalf("expected 0 visible tasks for soft-deleted project, got %d", len(tasks))
	}

	rec3, _ := app.Do(http.MethodDelete, fmt.Sprintf("/api/projects/%d?permanent=true", projectID), nil, token)
	if rec3.Code != http.StatusNoContent {
		t.Fatalf("expected 204 hard-delete, got %d", rec3.Code)
	}
	if app.CountTasks(projectID) != 0 {
		t.Fatalf("expected 0 tasks after hard-delete, got %d", app.CountTasks(projectID))
	}

	var noteRows, secRows, linkRows int64
	if err := app.DB.Model(&notestore.NoteRecord{}).Unscoped().Where("project_id = ?", projectID).Count(&noteRows).Error; err != nil {
		t.Fatal(err)
	}
	if err := app.DB.Model(&projectstore.SectionRecord{}).Unscoped().Where("project_id = ?", projectID).Count(&secRows).Error; err != nil {
		t.Fatal(err)
	}
	if err := app.DB.Model(&notestore.NoteTaskLinkRecord{}).Unscoped().
		Where("note_id = ?", noteID).Count(&linkRows).Error; err != nil {
		t.Fatal(err)
	}
	if noteRows != 0 || secRows != 0 || linkRows != 0 {
		t.Fatalf("expected 0 notes, 0 project_sections, 0 links after hard-delete; got notes=%d sections=%d links=%d",
			noteRows, secRows, linkRows)
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
