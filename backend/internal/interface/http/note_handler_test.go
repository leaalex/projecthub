package handler_test

import (
	"fmt"
	"net/http"
	"testing"

	domainuser "task-manager/backend/internal/domain/user"
	"task-manager/backend/internal/testutil"
)

func TestNote_CRUDAndLinks(t *testing.T) {
	app := testutil.NewTestApp(t)
	owner, pass := app.SeedUserWithPassword(domainuser.RoleCreator, "creator123")
	token, _ := app.Login(owner.Email().String(), pass)
	p := app.SeedProject(owner.ID().Uint(), "team")
	task := app.SeedTask(p.ID().Uint())

	var noteID uint
	t.Run("create note", func(t *testing.T) {
		rec, data := app.Do(http.MethodPost, fmt.Sprintf("/api/projects/%d/notes", p.ID().Uint()), map[string]any{
			"title": "Meeting notes",
			"body":  "# Agenda\n- Item 1",
		}, token)
		if rec.Code != http.StatusCreated {
			t.Fatalf("expected 201, got %d: %v", rec.Code, data)
		}
		n := data["note"].(map[string]any)
		noteID = uint(n["id"].(float64))
		if n["title"] != "Meeting notes" {
			t.Fatalf("unexpected title: %v", n["title"])
		}
	})

	t.Run("list notes", func(t *testing.T) {
		rec, data := app.Do(http.MethodGet, fmt.Sprintf("/api/projects/%d/notes", p.ID().Uint()), nil, token)
		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d: %v", rec.Code, data)
		}
		notes := data["notes"].([]any)
		if len(notes) != 1 {
			t.Fatalf("expected 1 note, got %d", len(notes))
		}
	})

	t.Run("get note with linked_task_ids", func(t *testing.T) {
		rec, data := app.Do(http.MethodGet, fmt.Sprintf("/api/projects/%d/notes/%d", p.ID().Uint(), noteID), nil, token)
		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d: %v", rec.Code, data)
		}
		n := data["note"].(map[string]any)
		ids, _ := n["linked_task_ids"].([]any)
		if len(ids) != 0 {
			t.Fatalf("expected no links yet, got %v", ids)
		}
	})

	t.Run("link task", func(t *testing.T) {
		rec, _ := app.Do(http.MethodPost, fmt.Sprintf("/api/projects/%d/notes/%d/links", p.ID().Uint(), noteID), map[string]any{
			"task_id": task.ID().Uint(),
		}, token)
		if rec.Code != http.StatusNoContent {
			t.Fatalf("expected 204, got %d", rec.Code)
		}
	})

	t.Run("task lists linked notes", func(t *testing.T) {
		rec, data := app.Do(http.MethodGet, fmt.Sprintf("/api/tasks/%d/notes", task.ID().Uint()), nil, token)
		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d: %v", rec.Code, data)
		}
		notes := data["notes"].([]any)
		if len(notes) != 1 {
			t.Fatalf("expected 1 linked note, got %d", len(notes))
		}
	})

	t.Run("duplicate link conflict", func(t *testing.T) {
		rec, _ := app.Do(http.MethodPost, fmt.Sprintf("/api/projects/%d/notes/%d/links", p.ID().Uint(), noteID), map[string]any{
			"task_id": task.ID().Uint(),
		}, token)
		if rec.Code != http.StatusConflict {
			t.Fatalf("expected 409, got %d", rec.Code)
		}
	})

	t.Run("soft delete note", func(t *testing.T) {
		rec, _ := app.Do(http.MethodDelete, fmt.Sprintf("/api/projects/%d/notes/%d", p.ID().Uint(), noteID), nil, token)
		if rec.Code != http.StatusNoContent {
			t.Fatalf("expected 204, got %d", rec.Code)
		}
		rec2, data := app.Do(http.MethodGet, fmt.Sprintf("/api/projects/%d/notes", p.ID().Uint()), nil, token)
		if rec2.Code != http.StatusOK {
			t.Fatal(rec2.Code, data)
		}
		notes := data["notes"].([]any)
		if len(notes) != 0 {
			t.Fatalf("expected empty list after soft delete, got %d", len(notes))
		}
	})
}

func TestNote_LinkTask_otherProjectRejected(t *testing.T) {
	app := testutil.NewTestApp(t)
	owner, pass := app.SeedUserWithPassword(domainuser.RoleCreator, "creator123")
	token, _ := app.Login(owner.Email().String(), pass)
	p1 := app.SeedProject(owner.ID().Uint(), "team")
	p2 := app.SeedProject(owner.ID().Uint(), "team")
	task2 := app.SeedTask(p2.ID().Uint())

	rec, data := app.Do(http.MethodPost, fmt.Sprintf("/api/projects/%d/notes", p1.ID().Uint()), map[string]any{
		"title": "N",
	}, token)
	if rec.Code != http.StatusCreated {
		t.Fatal(data)
	}
	noteID := uint(data["note"].(map[string]any)["id"].(float64))

	rec2, _ := app.Do(http.MethodPost, fmt.Sprintf("/api/projects/%d/notes/%d/links", p1.ID().Uint(), noteID), map[string]any{
		"task_id": task2.ID().Uint(),
	}, token)
	if rec2.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 cross-project, got %d", rec2.Code)
	}
}

func TestNote_Get_wrongProjectIdInPathReturns404(t *testing.T) {
	app := testutil.NewTestApp(t)
	owner, pass := app.SeedUserWithPassword(domainuser.RoleCreator, "creator123")
	token, _ := app.Login(owner.Email().String(), pass)
	p1 := app.SeedProject(owner.ID().Uint(), "team")
	p2 := app.SeedProject(owner.ID().Uint(), "team")

	rec, data := app.Do(http.MethodPost, fmt.Sprintf("/api/projects/%d/notes", p1.ID().Uint()), map[string]any{
		"title": "Only in P1",
	}, token)
	if rec.Code != http.StatusCreated {
		t.Fatal(data)
	}
	noteID := uint(data["note"].(map[string]any)["id"].(float64))

	rec2, _ := app.Do(http.MethodGet, fmt.Sprintf("/api/projects/%d/notes/%d", p2.ID().Uint(), noteID), nil, token)
	if rec2.Code != http.StatusNotFound {
		t.Fatalf("expected 404 for mismatched project id in path, got %d", rec2.Code)
	}
}

func TestNote_SoftDeleteRestoreHardDelete(t *testing.T) {
	app := testutil.NewTestApp(t)
	owner, pass := app.SeedUserWithPassword(domainuser.RoleCreator, "creator123")
	token, _ := app.Login(owner.Email().String(), pass)
	p := app.SeedProject(owner.ID().Uint(), "team")

	rec, data := app.Do(http.MethodPost, fmt.Sprintf("/api/projects/%d/notes", p.ID().Uint()), map[string]any{
		"title": "Lifecycle",
	}, token)
	if rec.Code != http.StatusCreated {
		t.Fatal(data)
	}
	noteID := uint(data["note"].(map[string]any)["id"].(float64))

	recDel, _ := app.Do(http.MethodDelete, fmt.Sprintf("/api/projects/%d/notes/%d", p.ID().Uint(), noteID), nil, token)
	if recDel.Code != http.StatusNoContent {
		t.Fatalf("soft delete: expected 204, got %d", recDel.Code)
	}

	recTrash, trashData := app.Do(http.MethodGet, fmt.Sprintf("/api/projects/%d/trash/notes", p.ID().Uint()), nil, token)
	if recTrash.Code != http.StatusOK {
		t.Fatalf("trash notes: %d %v", recTrash.Code, trashData)
	}
	notes := trashData["notes"].([]any)
	if len(notes) != 1 {
		t.Fatalf("expected 1 note in trash, got %d", len(notes))
	}

	recRest, _ := app.Do(http.MethodPost, fmt.Sprintf("/api/projects/%d/notes/%d/restore", p.ID().Uint(), noteID), nil, token)
	if recRest.Code != http.StatusNoContent {
		t.Fatalf("restore: expected 204, got %d", recRest.Code)
	}

	recTrash2, trashData2 := app.Do(http.MethodGet, fmt.Sprintf("/api/projects/%d/trash/notes", p.ID().Uint()), nil, token)
	if recTrash2.Code != http.StatusOK {
		t.Fatal(trashData2)
	}
	if len(trashData2["notes"].([]any)) != 0 {
		t.Fatal("expected empty trash after restore")
	}

	recDel2, _ := app.Do(http.MethodDelete, fmt.Sprintf("/api/projects/%d/notes/%d", p.ID().Uint(), noteID), nil, token)
	if recDel2.Code != http.StatusNoContent {
		t.Fatalf("second soft delete: %d", recDel2.Code)
	}

	recHard, _ := app.Do(http.MethodDelete, fmt.Sprintf("/api/projects/%d/notes/%d?permanent=true", p.ID().Uint(), noteID), nil, token)
	if recHard.Code != http.StatusNoContent {
		t.Fatalf("hard delete: expected 204, got %d", recHard.Code)
	}

	recTrash3, trashData3 := app.Do(http.MethodGet, fmt.Sprintf("/api/projects/%d/trash/notes", p.ID().Uint()), nil, token)
	if recTrash3.Code != http.StatusOK {
		t.Fatal(trashData3)
	}
	if len(trashData3["notes"].([]any)) != 0 {
		t.Fatal("expected empty trash after hard delete")
	}
}

func TestNote_Move_BetweenSections(t *testing.T) {
	app := testutil.NewTestApp(t)
	owner, pass := app.SeedUserWithPassword(domainuser.RoleCreator, "creator123")
	token, _ := app.Login(owner.Email().String(), pass)
	p := app.SeedProject(owner.ID().Uint(), "team")

	recA, dA := app.Do(http.MethodPost, fmt.Sprintf("/api/projects/%d/note-sections", p.ID().Uint()), map[string]any{
		"name": "A",
	}, token)
	if recA.Code != http.StatusCreated {
		t.Fatal(dA)
	}
	sidA := uint(dA["section"].(map[string]any)["id"].(float64))
	recB, dB := app.Do(http.MethodPost, fmt.Sprintf("/api/projects/%d/note-sections", p.ID().Uint()), map[string]any{
		"name": "B",
	}, token)
	if recB.Code != http.StatusCreated {
		t.Fatal(dB)
	}
	sidB := uint(dB["section"].(map[string]any)["id"].(float64))

	recN, dN := app.Do(http.MethodPost, fmt.Sprintf("/api/projects/%d/notes", p.ID().Uint()), map[string]any{
		"title":      "Movable",
		"section_id": sidA,
	}, token)
	if recN.Code != http.StatusCreated {
		t.Fatal(dN)
	}
	noteID := uint(dN["note"].(map[string]any)["id"].(float64))

	recM, _ := app.Do(http.MethodPost, fmt.Sprintf("/api/projects/%d/notes/%d/move", p.ID().Uint(), noteID), map[string]any{
		"section_id": sidB,
		"position":   0,
	}, token)
	if recM.Code != http.StatusOK {
		t.Fatalf("move: expected 200, got %d", recM.Code)
	}

	recG, dG := app.Do(http.MethodGet, fmt.Sprintf("/api/projects/%d/notes/%d", p.ID().Uint(), noteID), nil, token)
	if recG.Code != http.StatusOK {
		t.Fatal(dG)
	}
	sec := dG["note"].(map[string]any)["section_id"].(float64)
	if uint(sec) != sidB {
		t.Fatalf("expected section_id %d, got %.0f", sidB, sec)
	}
}

func TestNote_List_ViewerCanRead_ButCannotMutate_403(t *testing.T) {
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

	_, _ = app.Do(http.MethodPost, fmt.Sprintf("/api/projects/%d/notes", p.ID().Uint()), map[string]any{
		"title": "Owner note",
	}, ownerToken)

	recList, listData := app.Do(http.MethodGet, fmt.Sprintf("/api/projects/%d/notes", p.ID().Uint()), nil, memberToken)
	if recList.Code != http.StatusOK {
		t.Fatalf("viewer list: expected 200, got %d: %v", recList.Code, listData)
	}

	recCreate, _ := app.Do(http.MethodPost, fmt.Sprintf("/api/projects/%d/notes", p.ID().Uint()), map[string]any{
		"title": "Executor tries",
	}, memberToken)
	if recCreate.Code != http.StatusForbidden {
		t.Fatalf("executor create: expected 403, got %d", recCreate.Code)
	}
}
