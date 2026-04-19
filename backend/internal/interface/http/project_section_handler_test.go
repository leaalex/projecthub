package handler_test

import (
	"fmt"
	"net/http"
	"testing"

	domainuser "task-manager/backend/internal/domain/user"
	"task-manager/backend/internal/infrastructure/persistence/notestore"
	"task-manager/backend/internal/infrastructure/persistence/taskstore"
	"task-manager/backend/internal/testutil"
)

func mustTaskPosition(t *testing.T, app *testutil.TestApp, id uint) int {
	t.Helper()
	var r taskstore.TaskRecord
	if err := app.DB.First(&r, id).Error; err != nil {
		t.Fatal(err)
	}
	return r.Position
}

func mustNotePosition(t *testing.T, app *testutil.TestApp, id uint) int {
	t.Helper()
	var r notestore.NoteRecord
	if err := app.DB.First(&r, id).Error; err != nil {
		t.Fatal(err)
	}
	return r.Position
}

func TestProjectSection_ReorderItems_HappyPath(t *testing.T) {
	app := testutil.NewTestApp(t)
	owner, pass := app.SeedUserWithPassword(domainuser.RoleCreator, "creator123")
	token, _ := app.Login(owner.Email().String(), pass)

	rec, data := app.Do(http.MethodPost, "/api/projects", map[string]any{
		"name": "Reorder",
		"kind": "team",
	}, token)
	if rec.Code != http.StatusCreated {
		t.Fatalf("create project: %d %v", rec.Code, data)
	}
	pid := uint(data["project"].(map[string]any)["id"].(float64))

	recSec, dSec := app.Do(http.MethodPost, fmt.Sprintf("/api/projects/%d/sections", pid), map[string]any{
		"name": "Sec",
	}, token)
	if recSec.Code != http.StatusCreated {
		t.Fatalf("section: %d %v", recSec.Code, dSec)
	}
	sid := uint(dSec["section"].(map[string]any)["id"].(float64))

	recT1, dT1 := app.Do(http.MethodPost, "/api/tasks", map[string]any{
		"title":      "T1",
		"project_id": pid,
		"section_id": sid,
	}, token)
	if recT1.Code != http.StatusCreated {
		t.Fatalf("task1: %d %v", recT1.Code, dT1)
	}
	t1 := uint(dT1["task"].(map[string]any)["id"].(float64))
	recT2, dT2 := app.Do(http.MethodPost, "/api/tasks", map[string]any{
		"title":      "T2",
		"project_id": pid,
		"section_id": sid,
	}, token)
	if recT2.Code != http.StatusCreated {
		t.Fatalf("task2: %d %v", recT2.Code, dT2)
	}
	t2 := uint(dT2["task"].(map[string]any)["id"].(float64))

	recN1, dN1 := app.Do(http.MethodPost, fmt.Sprintf("/api/projects/%d/notes", pid), map[string]any{
		"title":      "N1",
		"section_id": sid,
	}, token)
	if recN1.Code != http.StatusCreated {
		t.Fatalf("note1: %d %v", recN1.Code, dN1)
	}
	n1 := uint(dN1["note"].(map[string]any)["id"].(float64))
	recN2, dN2 := app.Do(http.MethodPost, fmt.Sprintf("/api/projects/%d/notes", pid), map[string]any{
		"title":      "N2",
		"section_id": sid,
	}, token)
	if recN2.Code != http.StatusCreated {
		t.Fatalf("note2: %d %v", recN2.Code, dN2)
	}
	n2 := uint(dN2["note"].(map[string]any)["id"].(float64))

	path := fmt.Sprintf("/api/projects/%d/sections/%d/items/reorder", pid, sid)
	body := map[string]any{
		"items": []map[string]any{
			{"kind": "note", "id": float64(n1)},
			{"kind": "task", "id": float64(t1)},
			{"kind": "note", "id": float64(n2)},
			{"kind": "task", "id": float64(t2)},
		},
	}
	recR, _ := app.Do(http.MethodPost, path, body, token)
	if recR.Code != http.StatusNoContent {
		t.Fatalf("reorder: expected 204, got %d", recR.Code)
	}

	if mustNotePosition(t, app, n1) != 1 || mustTaskPosition(t, app, t1) != 2 ||
		mustNotePosition(t, app, n2) != 3 || mustTaskPosition(t, app, t2) != 4 {
		t.Fatalf("unexpected positions n1=%d t1=%d n2=%d t2=%d",
			mustNotePosition(t, app, n1), mustTaskPosition(t, app, t1),
			mustNotePosition(t, app, n2), mustTaskPosition(t, app, t2))
	}
}

func TestProjectSection_ReorderItems_Unsectioned(t *testing.T) {
	app := testutil.NewTestApp(t)
	owner, pass := app.SeedUserWithPassword(domainuser.RoleCreator, "creator123")
	token, _ := app.Login(owner.Email().String(), pass)

	rec, data := app.Do(http.MethodPost, "/api/projects", map[string]any{
		"name": "Unsec",
		"kind": "team",
	}, token)
	if rec.Code != http.StatusCreated {
		t.Fatal(data)
	}
	pid := uint(data["project"].(map[string]any)["id"].(float64))

	recT1, dT1 := app.Do(http.MethodPost, "/api/tasks", map[string]any{
		"title":      "A",
		"project_id": pid,
	}, token)
	if recT1.Code != http.StatusCreated {
		t.Fatal(dT1)
	}
	t1 := uint(dT1["task"].(map[string]any)["id"].(float64))
	recT2, dT2 := app.Do(http.MethodPost, "/api/tasks", map[string]any{
		"title":      "B",
		"project_id": pid,
	}, token)
	if recT2.Code != http.StatusCreated {
		t.Fatal(dT2)
	}
	t2 := uint(dT2["task"].(map[string]any)["id"].(float64))
	recN1, dN1 := app.Do(http.MethodPost, fmt.Sprintf("/api/projects/%d/notes", pid), map[string]any{
		"title": "nA",
	}, token)
	if recN1.Code != http.StatusCreated {
		t.Fatal(dN1)
	}
	n1 := uint(dN1["note"].(map[string]any)["id"].(float64))
	recN2, dN2 := app.Do(http.MethodPost, fmt.Sprintf("/api/projects/%d/notes", pid), map[string]any{
		"title": "nB",
	}, token)
	if recN2.Code != http.StatusCreated {
		t.Fatal(dN2)
	}
	n2 := uint(dN2["note"].(map[string]any)["id"].(float64))

	path := fmt.Sprintf("/api/projects/%d/sections/0/items/reorder", pid)
	body := map[string]any{
		"items": []map[string]any{
			{"kind": "note", "id": float64(n2)},
			{"kind": "task", "id": float64(t2)},
			{"kind": "note", "id": float64(n1)},
			{"kind": "task", "id": float64(t1)},
		},
	}
	recR, _ := app.Do(http.MethodPost, path, body, token)
	if recR.Code != http.StatusNoContent {
		t.Fatalf("reorder: expected 204, got %d", recR.Code)
	}
	if mustNotePosition(t, app, n2) != 1 || mustTaskPosition(t, app, t2) != 2 ||
		mustNotePosition(t, app, n1) != 3 || mustTaskPosition(t, app, t1) != 4 {
		t.Fatal("unexpected positions for unsectioned reorder")
	}
}

func TestProjectSection_ReorderItems_ExecutorForbidden(t *testing.T) {
	app := testutil.NewTestApp(t)
	owner, ownerPass := app.SeedUserWithPassword(domainuser.RoleCreator, "creator123")
	member, _ := app.SeedUserWithPassword(domainuser.RoleUser, "memberpass")
	ownerToken, _ := app.Login(owner.Email().String(), ownerPass)
	memberToken, _ := app.Login(member.Email().String(), "memberpass")

	rec, data := app.Do(http.MethodPost, "/api/projects", map[string]any{
		"name": "Exec",
		"kind": "team",
	}, ownerToken)
	if rec.Code != http.StatusCreated {
		t.Fatal(data)
	}
	pid := uint(data["project"].(map[string]any)["id"].(float64))
	app.Do(http.MethodPost, fmt.Sprintf("/api/projects/%d/members", pid), map[string]any{
		"user_id": member.ID().Uint(),
		"role":    "executor",
	}, ownerToken)

	recSec, dSec := app.Do(http.MethodPost, fmt.Sprintf("/api/projects/%d/sections", pid), map[string]any{
		"name": "S",
	}, ownerToken)
	if recSec.Code != http.StatusCreated {
		t.Fatal(dSec)
	}
	sid := uint(dSec["section"].(map[string]any)["id"].(float64))
	recT, dT := app.Do(http.MethodPost, "/api/tasks", map[string]any{
		"title":      "T",
		"project_id": pid,
		"section_id": sid,
	}, ownerToken)
	if recT.Code != http.StatusCreated {
		t.Fatal(dT)
	}
	tid := uint(dT["task"].(map[string]any)["id"].(float64))

	path := fmt.Sprintf("/api/projects/%d/sections/%d/items/reorder", pid, sid)
	body := map[string]any{
		"items": []map[string]any{{"kind": "task", "id": float64(tid)}},
	}
	recR, _ := app.Do(http.MethodPost, path, body, memberToken)
	if recR.Code != http.StatusForbidden {
		t.Fatalf("executor reorder: expected 403, got %d", recR.Code)
	}
}

func TestProjectSection_ReorderItems_StrangerForbidden(t *testing.T) {
	app := testutil.NewTestApp(t)
	owner, pass := app.SeedUserWithPassword(domainuser.RoleCreator, "creator123")
	other, otherPass := app.SeedUserWithPassword(domainuser.RoleCreator, "other123")
	token, _ := app.Login(owner.Email().String(), pass)
	otherToken, _ := app.Login(other.Email().String(), otherPass)

	rec, data := app.Do(http.MethodPost, "/api/projects", map[string]any{
		"name": "Priv",
		"kind": "team",
	}, token)
	if rec.Code != http.StatusCreated {
		t.Fatal(data)
	}
	pid := uint(data["project"].(map[string]any)["id"].(float64))
	recSec, dSec := app.Do(http.MethodPost, fmt.Sprintf("/api/projects/%d/sections", pid), map[string]any{
		"name": "S",
	}, token)
	if recSec.Code != http.StatusCreated {
		t.Fatal(dSec)
	}
	sid := uint(dSec["section"].(map[string]any)["id"].(float64))
	recT, dT := app.Do(http.MethodPost, "/api/tasks", map[string]any{
		"title":      "T",
		"project_id": pid,
		"section_id": sid,
	}, token)
	if recT.Code != http.StatusCreated {
		t.Fatal(dT)
	}
	tid := uint(dT["task"].(map[string]any)["id"].(float64))

	path := fmt.Sprintf("/api/projects/%d/sections/%d/items/reorder", pid, sid)
	body := map[string]any{
		"items": []map[string]any{{"kind": "task", "id": float64(tid)}},
	}
	recR, _ := app.Do(http.MethodPost, path, body, otherToken)
	if recR.Code != http.StatusForbidden {
		t.Fatalf("stranger reorder: expected 403, got %d", recR.Code)
	}
}

func TestProjectSection_ReorderItems_BadRequest(t *testing.T) {
	app := testutil.NewTestApp(t)
	owner, pass := app.SeedUserWithPassword(domainuser.RoleCreator, "creator123")
	token, _ := app.Login(owner.Email().String(), pass)

	rec, data := app.Do(http.MethodPost, "/api/projects", map[string]any{
		"name": "Bad",
		"kind": "team",
	}, token)
	if rec.Code != http.StatusCreated {
		t.Fatal(data)
	}
	pid := uint(data["project"].(map[string]any)["id"].(float64))
	recSec, dSec := app.Do(http.MethodPost, fmt.Sprintf("/api/projects/%d/sections", pid), map[string]any{
		"name": "S",
	}, token)
	if recSec.Code != http.StatusCreated {
		t.Fatal(dSec)
	}
	sid := uint(dSec["section"].(map[string]any)["id"].(float64))
	recT1, dT1 := app.Do(http.MethodPost, "/api/tasks", map[string]any{
		"title":      "T1",
		"project_id": pid,
		"section_id": sid,
	}, token)
	if recT1.Code != http.StatusCreated {
		t.Fatal(dT1)
	}
	t1 := uint(dT1["task"].(map[string]any)["id"].(float64))
	recT2, dT2 := app.Do(http.MethodPost, "/api/tasks", map[string]any{
		"title":      "T2",
		"project_id": pid,
		"section_id": sid,
	}, token)
	if recT2.Code != http.StatusCreated {
		t.Fatal(dT2)
	}
	t2 := uint(dT2["task"].(map[string]any)["id"].(float64))
	recN, dN := app.Do(http.MethodPost, fmt.Sprintf("/api/projects/%d/notes", pid), map[string]any{
		"title":      "N",
		"section_id": sid,
	}, token)
	if recN.Code != http.StatusCreated {
		t.Fatal(dN)
	}
	n1 := uint(dN["note"].(map[string]any)["id"].(float64))

	path := fmt.Sprintf("/api/projects/%d/sections/%d/items/reorder", pid, sid)

	t.Run("length mismatch", func(t *testing.T) {
		recR, _ := app.Do(http.MethodPost, path, map[string]any{
			"items": []map[string]any{{"kind": "task", "id": float64(t1)}},
		}, token)
		if recR.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", recR.Code)
		}
	})

	t.Run("duplicate task ref", func(t *testing.T) {
		recR, _ := app.Do(http.MethodPost, path, map[string]any{
			"items": []map[string]any{
				{"kind": "task", "id": float64(t1)},
				{"kind": "task", "id": float64(t1)},
				{"kind": "task", "id": float64(t2)},
				{"kind": "note", "id": float64(n1)},
			},
		}, token)
		if recR.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", recR.Code)
		}
	})

	t.Run("wrong kind string", func(t *testing.T) {
		recR, _ := app.Do(http.MethodPost, path, map[string]any{
			"items": []map[string]any{
				{"kind": "task", "id": float64(t1)},
				{"kind": "bogus", "id": float64(t2)},
				{"kind": "note", "id": float64(n1)},
			},
		}, token)
		if recR.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", recR.Code)
		}
	})

	t.Run("unknown id in section set", func(t *testing.T) {
		recR, _ := app.Do(http.MethodPost, path, map[string]any{
			"items": []map[string]any{
				{"kind": "task", "id": float64(t1)},
				{"kind": "task", "id": float64(t2)},
				{"kind": "note", "id": float64(n1)},
				{"kind": "task", "id": 999999},
			},
		}, token)
		if recR.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", recR.Code)
		}
	})

	t.Run("task kind with note id", func(t *testing.T) {
		recR, _ := app.Do(http.MethodPost, path, map[string]any{
			"items": []map[string]any{
				{"kind": "task", "id": float64(t1)},
				{"kind": "task", "id": float64(n1)},
				{"kind": "task", "id": float64(t2)},
			},
		}, token)
		if recR.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", recR.Code)
		}
	})
}

func TestProjectSection_ReorderItems_SectionFromOtherProject_NotFound(t *testing.T) {
	app := testutil.NewTestApp(t)
	owner, pass := app.SeedUserWithPassword(domainuser.RoleCreator, "creator123")
	token, _ := app.Login(owner.Email().String(), pass)

	rec1, d1 := app.Do(http.MethodPost, "/api/projects", map[string]any{
		"name": "P1",
		"kind": "team",
	}, token)
	if rec1.Code != http.StatusCreated {
		t.Fatal(d1)
	}
	p1 := uint(d1["project"].(map[string]any)["id"].(float64))
	rec2, d2 := app.Do(http.MethodPost, "/api/projects", map[string]any{
		"name": "P2",
		"kind": "team",
	}, token)
	if rec2.Code != http.StatusCreated {
		t.Fatal(d2)
	}
	p2 := uint(d2["project"].(map[string]any)["id"].(float64))

	recSec, dSec := app.Do(http.MethodPost, fmt.Sprintf("/api/projects/%d/sections", p2), map[string]any{
		"name": "Other",
	}, token)
	if recSec.Code != http.StatusCreated {
		t.Fatal(dSec)
	}
	sOther := uint(dSec["section"].(map[string]any)["id"].(float64))

	// Valid task in p1 (unsectioned); reorder URL uses section id from p2 → ErrSectionNotFound.
	recT2, dT2 := app.Do(http.MethodPost, "/api/tasks", map[string]any{
		"title":      "Lonely",
		"project_id": p1,
	}, token)
	if recT2.Code != http.StatusCreated {
		t.Fatal(dT2)
	}
	tid := uint(dT2["task"].(map[string]any)["id"].(float64))

	// p1 URL but section id belongs to p2 only.
	path := fmt.Sprintf("/api/projects/%d/sections/%d/items/reorder", p1, sOther)
	body := map[string]any{
		"items": []map[string]any{{"kind": "task", "id": float64(tid)}},
	}
	recR, _ := app.Do(http.MethodPost, path, body, token)
	if recR.Code != http.StatusNotFound {
		t.Fatalf("expected 404 for foreign section, got %d", recR.Code)
	}
}
