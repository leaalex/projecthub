package handler_test

import (
	"fmt"
	"net/http"
	"testing"

	domainuser "task-manager/backend/internal/domain/user"
	"task-manager/backend/internal/testutil"
)

func TestNoteSection_CRUD(t *testing.T) {
	app := testutil.NewTestApp(t)
	owner, pass := app.SeedUserWithPassword(domainuser.RoleCreator, "creator123")
	token, _ := app.Login(owner.Email().String(), pass)
	p := app.SeedProject(owner.ID().Uint(), "team")

	var secID uint
	t.Run("create section", func(t *testing.T) {
		rec, data := app.Do(http.MethodPost, fmt.Sprintf("/api/projects/%d/note-sections", p.ID().Uint()), map[string]any{
			"name": "Ideas",
		}, token)
		if rec.Code != http.StatusCreated {
			t.Fatalf("expected 201, got %d: %v", rec.Code, data)
		}
		sec := data["section"].(map[string]any)
		secID = uint(sec["id"].(float64))
		if sec["name"] != "Ideas" {
			t.Fatalf("unexpected name: %v", sec["name"])
		}
	})

	t.Run("list sections", func(t *testing.T) {
		rec, data := app.Do(http.MethodGet, fmt.Sprintf("/api/projects/%d/note-sections", p.ID().Uint()), nil, token)
		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d: %v", rec.Code, data)
		}
		secs := data["sections"].([]any)
		if len(secs) != 1 {
			t.Fatalf("expected 1 section, got %d", len(secs))
		}
	})

	t.Run("rename section", func(t *testing.T) {
		rec, data := app.Do(http.MethodPut, fmt.Sprintf("/api/projects/%d/note-sections/%d", p.ID().Uint(), secID), map[string]any{
			"name": "Ideas v2",
		}, token)
		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d: %v", rec.Code, data)
		}
		sec := data["section"].(map[string]any)
		if sec["name"] != "Ideas v2" {
			t.Fatalf("unexpected name: %v", sec["name"])
		}
	})

	t.Run("delete section", func(t *testing.T) {
		rec, _ := app.Do(http.MethodDelete, fmt.Sprintf("/api/projects/%d/note-sections/%d", p.ID().Uint(), secID), nil, token)
		if rec.Code != http.StatusNoContent {
			t.Fatalf("expected 204, got %d", rec.Code)
		}
		rec2, data := app.Do(http.MethodGet, fmt.Sprintf("/api/projects/%d/note-sections", p.ID().Uint()), nil, token)
		if rec2.Code != http.StatusOK {
			t.Fatal(data)
		}
		secs := data["sections"].([]any)
		if len(secs) != 0 {
			t.Fatalf("expected 0 sections, got %d", len(secs))
		}
	})
}
