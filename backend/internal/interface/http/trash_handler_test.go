package handler_test

import (
	"fmt"
	"net/http"
	"testing"

	domainuser "task-manager/backend/internal/domain/user"
	"task-manager/backend/internal/testutil"
)

func TestTrash_ListDeletedTasksAndNotes(t *testing.T) {
	app := testutil.NewTestApp(t)
	owner, pass := app.SeedUserWithPassword(domainuser.RoleCreator, "creator123")
	token, _ := app.Login(owner.Email().String(), pass)
	p := app.SeedProject(owner.ID().Uint(), "team")
	tk := app.SeedTask(p.ID().Uint())

	recN, dN := app.Do(http.MethodPost, fmt.Sprintf("/api/projects/%d/notes", p.ID().Uint()), map[string]any{
		"title": "Trashed note",
	}, token)
	if recN.Code != http.StatusCreated {
		t.Fatal(dN)
	}
	noteID := uint(dN["note"].(map[string]any)["id"].(float64))

	recDT, _ := app.Do(http.MethodDelete, fmt.Sprintf("/api/tasks/%d", tk.ID().Uint()), nil, token)
	if recDT.Code != http.StatusNoContent {
		t.Fatalf("delete task: %d", recDT.Code)
	}
	recDN, _ := app.Do(http.MethodDelete, fmt.Sprintf("/api/projects/%d/notes/%d", p.ID().Uint(), noteID), nil, token)
	if recDN.Code != http.StatusNoContent {
		t.Fatalf("delete note: %d", recDN.Code)
	}

	recTT, dTT := app.Do(http.MethodGet, fmt.Sprintf("/api/projects/%d/trash/tasks", p.ID().Uint()), nil, token)
	if recTT.Code != http.StatusOK {
		t.Fatal(dTT)
	}
	if len(dTT["tasks"].([]any)) != 1 {
		t.Fatalf("expected 1 deleted task, got %d", len(dTT["tasks"].([]any)))
	}

	recTN, dTN := app.Do(http.MethodGet, fmt.Sprintf("/api/projects/%d/trash/notes", p.ID().Uint()), nil, token)
	if recTN.Code != http.StatusOK {
		t.Fatal(dTN)
	}
	if len(dTN["notes"].([]any)) != 1 {
		t.Fatalf("expected 1 deleted note, got %d", len(dTN["notes"].([]any)))
	}
}

func TestTrash_RestoreTaskAndPermanentDeleteNote(t *testing.T) {
	app := testutil.NewTestApp(t)
	owner, pass := app.SeedUserWithPassword(domainuser.RoleCreator, "creator123")
	token, _ := app.Login(owner.Email().String(), pass)
	p := app.SeedProject(owner.ID().Uint(), "team")
	tk := app.SeedTask(p.ID().Uint())

	recN, dN := app.Do(http.MethodPost, fmt.Sprintf("/api/projects/%d/notes", p.ID().Uint()), map[string]any{
		"title": "N",
	}, token)
	if recN.Code != http.StatusCreated {
		t.Fatal(dN)
	}
	noteID := uint(dN["note"].(map[string]any)["id"].(float64))

	recDT, _ := app.Do(http.MethodDelete, fmt.Sprintf("/api/tasks/%d", tk.ID().Uint()), nil, token)
	if recDT.Code != http.StatusNoContent {
		t.Fatal(recDT.Code)
	}
	recDN, _ := app.Do(http.MethodDelete, fmt.Sprintf("/api/projects/%d/notes/%d", p.ID().Uint(), noteID), nil, token)
	if recDN.Code != http.StatusNoContent {
		t.Fatal(recDN.Code)
	}

	recRT, _ := app.Do(http.MethodPost, fmt.Sprintf("/api/projects/%d/trash/tasks/%d/restore", p.ID().Uint(), tk.ID().Uint()), nil, token)
	if recRT.Code != http.StatusNoContent {
		t.Fatalf("restore task: %d", recRT.Code)
	}

	recTT, dTT := app.Do(http.MethodGet, fmt.Sprintf("/api/projects/%d/trash/tasks", p.ID().Uint()), nil, token)
	if recTT.Code != http.StatusOK {
		t.Fatal(dTT)
	}
	if len(dTT["tasks"].([]any)) != 0 {
		t.Fatal("expected no tasks in trash after restore")
	}

	recHard, _ := app.Do(http.MethodDelete, fmt.Sprintf("/api/projects/%d/notes/%d?permanent=true", p.ID().Uint(), noteID), nil, token)
	if recHard.Code != http.StatusNoContent {
		t.Fatalf("permanent note delete: %d", recHard.Code)
	}

	recTN, dTN := app.Do(http.MethodGet, fmt.Sprintf("/api/projects/%d/trash/notes", p.ID().Uint()), nil, token)
	if recTN.Code != http.StatusOK {
		t.Fatal(dTN)
	}
	if len(dTN["notes"].([]any)) != 0 {
		t.Fatal("expected no notes in trash after permanent delete")
	}
}
