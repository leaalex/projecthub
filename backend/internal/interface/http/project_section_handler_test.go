package handler_test

import (
	"fmt"
	"net/http"
	"testing"
	"time"

	domainuser "task-manager/backend/internal/domain/user"
	"task-manager/backend/internal/domain/ordering"
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

func mustTaskUpdatedAt(t *testing.T, app *testutil.TestApp, id uint) time.Time {
	t.Helper()
	var r taskstore.TaskRecord
	if err := app.DB.First(&r, id).Error; err != nil {
		t.Fatal(err)
	}
	return r.UpdatedAt
}

func assertTimeUnchanged(t *testing.T, label string, before, after time.Time) {
	t.Helper()
	if before.UnixMicro() != after.UnixMicro() {
		t.Fatalf("%s: updated_at changed: before=%v after=%v", label, before, after)
	}
}

func moveItemURL(pid uint) string {
	return fmt.Sprintf("/api/projects/%d/items/move", pid)
}

func TestProjectSection_MoveItem_TwoTasksReorder(t *testing.T) {
	app := testutil.NewTestApp(t)
	owner, pass := app.SeedUserWithPassword(domainuser.RoleCreator, "creator123")
	token, _ := app.Login(owner.Email().String(), pass)

	rec, data := app.Do(http.MethodPost, "/api/projects", map[string]any{
		"name": "Move2",
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

	p1 := mustTaskPosition(t, app, t1)
	p2 := mustTaskPosition(t, app, t2)
	if p1 >= p2 {
		t.Fatalf("expected t1 before t2 initially, got pos %d %d", p1, p2)
	}

	recM, dM := app.Do(http.MethodPost, moveItemURL(pid), map[string]any{
		"kind":       "task",
		"id":         t2,
		"section_id": sid,
		"before_id":  nil,
		"after_id": map[string]any{
			"kind": "task",
			"id":   t1,
		},
	}, token)
	if recM.Code != http.StatusOK {
		t.Fatalf("move: %d %v", recM.Code, dM)
	}
	p1a := mustTaskPosition(t, app, t1)
	p2a := mustTaskPosition(t, app, t2)
	if p2a >= p1a {
		t.Fatalf("expected t2 before t1 after move, got pos t2=%d t1=%d", p2a, p1a)
	}
}

func TestProjectSection_MoveItem_DoesNotBumpUpdatedAt(t *testing.T) {
	app := testutil.NewTestApp(t)
	owner, pass := app.SeedUserWithPassword(domainuser.RoleCreator, "creator123")
	token, _ := app.Login(owner.Email().String(), pass)

	rec, data := app.Do(http.MethodPost, "/api/projects", map[string]any{
		"name": "MoveUpd",
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

	u1Before := mustTaskUpdatedAt(t, app, t1)
	u2Before := mustTaskUpdatedAt(t, app, t2)

	recM, dM := app.Do(http.MethodPost, moveItemURL(pid), map[string]any{
		"kind":       "task",
		"id":         t2,
		"section_id": sid,
		"before_id":  nil,
		"after_id": map[string]any{
			"kind": "task",
			"id":   t1,
		},
	}, token)
	if recM.Code != http.StatusOK {
		t.Fatalf("move: %d %v", recM.Code, dM)
	}

	assertTimeUnchanged(t, "t1", u1Before, mustTaskUpdatedAt(t, app, t1))
	assertTimeUnchanged(t, "t2", u2Before, mustTaskUpdatedAt(t, app, t2))
}

func TestProjectSection_MoveItem_Rebalance_DoesNotBumpNeighbors(t *testing.T) {
	app := testutil.NewTestApp(t)
	owner, pass := app.SeedUserWithPassword(domainuser.RoleCreator, "creator123")
	token, _ := app.Login(owner.Email().String(), pass)

	rec, data := app.Do(http.MethodPost, "/api/projects", map[string]any{
		"name": "RebalUpd",
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

	var t1, t2, t3 uint
	for i, title := range []string{"T1", "T2", "T3"} {
		recT, dT := app.Do(http.MethodPost, "/api/tasks", map[string]any{
			"title":      title,
			"project_id": pid,
			"section_id": sid,
		}, token)
		if recT.Code != http.StatusCreated {
			t.Fatalf("task %d: %d %v", i, recT.Code, dT)
		}
		id := uint(dT["task"].(map[string]any)["id"].(float64))
		switch i {
		case 0:
			t1 = id
		case 1:
			t2 = id
		case 2:
			t3 = id
		}
	}

	if err := app.DB.Model(&taskstore.TaskRecord{}).Where("id = ?", t1).UpdateColumn("position", 100).Error; err != nil {
		t.Fatal(err)
	}
	if err := app.DB.Model(&taskstore.TaskRecord{}).Where("id = ?", t2).UpdateColumn("position", 101).Error; err != nil {
		t.Fatal(err)
	}
	if err := app.DB.Model(&taskstore.TaskRecord{}).Where("id = ?", t3).UpdateColumn("position", 500).Error; err != nil {
		t.Fatal(err)
	}

	u1Before := mustTaskUpdatedAt(t, app, t1)
	u2Before := mustTaskUpdatedAt(t, app, t2)
	u3Before := mustTaskUpdatedAt(t, app, t3)

	recM, dM := app.Do(http.MethodPost, moveItemURL(pid), map[string]any{
		"kind":       "task",
		"id":         t3,
		"section_id": sid,
		"before_id": map[string]any{
			"kind": "task",
			"id":   t1,
		},
		"after_id": map[string]any{
			"kind": "task",
			"id":   t2,
		},
	}, token)
	if recM.Code != http.StatusOK {
		t.Fatalf("move: %d %v", recM.Code, dM)
	}

	assertTimeUnchanged(t, "t1", u1Before, mustTaskUpdatedAt(t, app, t1))
	assertTimeUnchanged(t, "t2", u2Before, mustTaskUpdatedAt(t, app, t2))
	assertTimeUnchanged(t, "t3", u3Before, mustTaskUpdatedAt(t, app, t3))

	step := int(ordering.Step)
	if got := mustTaskPosition(t, app, t1); got != step {
		t.Fatalf("t1 position want %d got %d", step, got)
	}
	if got := mustTaskPosition(t, app, t3); got != 2*step {
		t.Fatalf("t3 position want %d got %d", 2*step, got)
	}
	if got := mustTaskPosition(t, app, t2); got != 3*step {
		t.Fatalf("t2 position want %d got %d", 3*step, got)
	}
}

func TestProjectSection_MoveItem_UnsectionedMixed(t *testing.T) {
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
	recN1, dN1 := app.Do(http.MethodPost, fmt.Sprintf("/api/projects/%d/notes", pid), map[string]any{
		"title": "nA",
	}, token)
	if recN1.Code != http.StatusCreated {
		t.Fatal(dN1)
	}
	n1 := uint(dN1["note"].(map[string]any)["id"].(float64))

	recM, _ := app.Do(http.MethodPost, moveItemURL(pid), map[string]any{
		"kind":       "note",
		"id":         n1,
		"section_id": nil,
		"before_id":  nil,
		"after_id": map[string]any{
			"kind": "task",
			"id":   t1,
		},
	}, token)
	if recM.Code != http.StatusOK {
		t.Fatalf("move note before task: %d", recM.Code)
	}
	if mustNotePosition(t, app, n1) >= mustTaskPosition(t, app, t1) {
		t.Fatal("expected note before task")
	}
}

func TestProjectSection_MoveItem_ExecutorForbidden(t *testing.T) {
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

	recR, _ := app.Do(http.MethodPost, moveItemURL(pid), map[string]any{
		"kind":       "task",
		"id":         tid,
		"section_id": sid,
	}, memberToken)
	if recR.Code != http.StatusForbidden {
		t.Fatalf("executor move: expected 403, got %d", recR.Code)
	}
}

func TestProjectSection_MoveItem_StrangerForbidden(t *testing.T) {
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

	recR, _ := app.Do(http.MethodPost, moveItemURL(pid), map[string]any{
		"kind":       "task",
		"id":         tid,
		"section_id": sid,
	}, otherToken)
	if recR.Code != http.StatusForbidden {
		t.Fatalf("stranger move: expected 403, got %d", recR.Code)
	}
}

func TestProjectSection_MoveItem_BadRequest_nonAdjacentRefs(t *testing.T) {
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
	recT3, dT3 := app.Do(http.MethodPost, "/api/tasks", map[string]any{
		"title":      "T3",
		"project_id": pid,
		"section_id": sid,
	}, token)
	if recT3.Code != http.StatusCreated {
		t.Fatal(dT3)
	}
	_ = uint(dT3["task"].(map[string]any)["id"].(float64)) // t3 — между t1 и t4
	recT4, dT4 := app.Do(http.MethodPost, "/api/tasks", map[string]any{
		"title":      "T4",
		"project_id": pid,
		"section_id": sid,
	}, token)
	if recT4.Code != http.StatusCreated {
		t.Fatal(dT4)
	}
	t4 := uint(dT4["task"].(map[string]any)["id"].(float64))

	// Порядок t1,t2,t3,t4 — исключаем t2: t1,t3,t4; before=t1 after=t4 не соседи
	recR, _ := app.Do(http.MethodPost, moveItemURL(pid), map[string]any{
		"kind":       "task",
		"id":         t2,
		"section_id": sid,
		"before_id": map[string]any{"kind": "task", "id": t1},
		"after_id":  map[string]any{"kind": "task", "id": t4},
	}, token)
	if recR.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", recR.Code)
	}
}

func TestProjectSection_MoveItem_SectionFromOtherProject_NotFound(t *testing.T) {
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

	recT2, dT2 := app.Do(http.MethodPost, "/api/tasks", map[string]any{
		"title":      "Lonely",
		"project_id": p1,
	}, token)
	if recT2.Code != http.StatusCreated {
		t.Fatal(dT2)
	}
	tid := uint(dT2["task"].(map[string]any)["id"].(float64))

	recR, _ := app.Do(http.MethodPost, moveItemURL(p1), map[string]any{
		"kind":       "task",
		"id":         tid,
		"section_id": sOther,
	}, token)
	if recR.Code != http.StatusNotFound {
		t.Fatalf("expected 404 for foreign section, got %d", recR.Code)
	}
}
