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

func TestTrash_GetDeletedTaskAndNote(t *testing.T) {
	app := testutil.NewTestApp(t)
	owner, pass := app.SeedUserWithPassword(domainuser.RoleCreator, "creator123")
	token, _ := app.Login(owner.Email().String(), pass)
	p := app.SeedProject(owner.ID().Uint(), "team")
	tk := app.SeedTask(p.ID().Uint())

	recN, dN := app.Do(http.MethodPost, fmt.Sprintf("/api/projects/%d/notes", p.ID().Uint()), map[string]any{
		"title": "Trashed note",
		"body":  "Secret body",
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

	recGT, dGT := app.Do(http.MethodGet, fmt.Sprintf("/api/projects/%d/trash/tasks/%d", p.ID().Uint(), tk.ID().Uint()), nil, token)
	if recGT.Code != http.StatusOK {
		t.Fatalf("get deleted task: %d %v", recGT.Code, dGT)
	}
	taskObj := dGT["task"].(map[string]any)
	if taskObj["title"] == nil || taskObj["description"] == nil {
		t.Fatal("expected task title and description in response")
	}

	recGN, dGN := app.Do(http.MethodGet, fmt.Sprintf("/api/projects/%d/trash/notes/%d", p.ID().Uint(), noteID), nil, token)
	if recGN.Code != http.StatusOK {
		t.Fatalf("get deleted note: %d %v", recGN.Code, dGN)
	}
	noteObj := dGN["note"].(map[string]any)
	if noteObj["body"] != "Secret body" {
		t.Fatalf("expected note body, got %v", noteObj["body"])
	}
}

func TestTrash_GetDeleted_LiveReturns404(t *testing.T) {
	app := testutil.NewTestApp(t)
	owner, pass := app.SeedUserWithPassword(domainuser.RoleCreator, "creator123")
	token, _ := app.Login(owner.Email().String(), pass)
	p := app.SeedProject(owner.ID().Uint(), "team")
	tk := app.SeedTask(p.ID().Uint())

	recN, dN := app.Do(http.MethodPost, fmt.Sprintf("/api/projects/%d/notes", p.ID().Uint()), map[string]any{
		"title": "Live note",
	}, token)
	if recN.Code != http.StatusCreated {
		t.Fatal(dN)
	}
	noteID := uint(dN["note"].(map[string]any)["id"].(float64))

	recGT, _ := app.Do(http.MethodGet, fmt.Sprintf("/api/projects/%d/trash/tasks/%d", p.ID().Uint(), tk.ID().Uint()), nil, token)
	if recGT.Code != http.StatusNotFound {
		t.Fatalf("live task via trash get: expected 404, got %d", recGT.Code)
	}
	recGN, _ := app.Do(http.MethodGet, fmt.Sprintf("/api/projects/%d/trash/notes/%d", p.ID().Uint(), noteID), nil, token)
	if recGN.Code != http.StatusNotFound {
		t.Fatalf("live note via trash get: expected 404, got %d", recGN.Code)
	}
}

func TestTrash_GetDeleted_ExecutorForbidden(t *testing.T) {
	app := testutil.NewTestApp(t)
	owner, ownerPass := app.SeedUserWithPassword(domainuser.RoleCreator, "creator123")
	member, _ := app.SeedUserWithPassword(domainuser.RoleUser, "memberpass")
	ownerToken, _ := app.Login(owner.Email().String(), ownerPass)
	memberToken, _ := app.Login(member.Email().String(), "memberpass")

	p := app.SeedProject(owner.ID().Uint(), "team")
	app.Do(http.MethodPost, fmt.Sprintf("/api/projects/%d/members", p.ID().Uint()), map[string]any{
		"user_id": member.ID().Uint(),
		"role":    "executor",
	}, ownerToken)

	tk := app.SeedTask(p.ID().Uint())
	recDT, _ := app.Do(http.MethodDelete, fmt.Sprintf("/api/tasks/%d", tk.ID().Uint()), nil, ownerToken)
	if recDT.Code != http.StatusNoContent {
		t.Fatal(recDT.Code)
	}

	recGT, _ := app.Do(http.MethodGet, fmt.Sprintf("/api/projects/%d/trash/tasks/%d", p.ID().Uint(), tk.ID().Uint()), nil, memberToken)
	if recGT.Code != http.StatusForbidden {
		t.Fatalf("executor get deleted task: expected 403, got %d", recGT.Code)
	}
}
