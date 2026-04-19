package handler_test

import (
	"fmt"
	"net/http"
	"testing"

	domainuser "task-manager/backend/internal/domain/user"
	"task-manager/backend/internal/testutil"
)

func TestMember_AddUpdateRemove(t *testing.T) {
	app := testutil.NewTestApp(t)
	owner, ownerPass := app.SeedUserWithPassword(domainuser.RoleCreator, "creator123")
	member, _ := app.SeedUserWithPassword(domainuser.RoleUser, "userpass123")
	ownerToken, _ := app.Login(owner.Email().String(), ownerPass)

	p := app.SeedProject(owner.ID().Uint(), "team")
	pid := p.ID().Uint()

	t.Run("add member", func(t *testing.T) {
		rec, data := app.Do(http.MethodPost, fmt.Sprintf("/api/projects/%d/members", pid), map[string]any{
			"user_id": member.ID().Uint(),
			"role":    "executor",
		}, ownerToken)
		if rec.Code != http.StatusCreated {
			t.Fatalf("expected 201, got %d: %v", rec.Code, data)
		}
		m := data["member"].(map[string]any)
		if m["role"] != "executor" {
			t.Fatalf("expected role executor, got %v", m["role"])
		}
	})

	t.Run("list members includes added member", func(t *testing.T) {
		rec, data := app.Do(http.MethodGet, fmt.Sprintf("/api/projects/%d/members", pid), nil, ownerToken)
		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d: %v", rec.Code, data)
		}
		members := data["members"].([]any)
		found := false
		for _, item := range members {
			m := item.(map[string]any)
			u := m["user"].(map[string]any)
			if uint(u["id"].(float64)) == member.ID().Uint() {
				found = true
				break
			}
		}
		if !found {
			t.Fatalf("added member not in list")
		}
	})

	t.Run("update role to manager", func(t *testing.T) {
		rec, data := app.Do(http.MethodPut, fmt.Sprintf("/api/projects/%d/members/%d", pid, member.ID().Uint()), map[string]any{
			"role": "manager",
		}, ownerToken)
		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d: %v", rec.Code, data)
		}
		m := data["member"].(map[string]any)
		if m["role"] != "manager" {
			t.Fatalf("expected role manager, got %v", m["role"])
		}
	})

	t.Run("remove member (unassigned mode, no tasks)", func(t *testing.T) {
		rec, data := app.Do(http.MethodDelete, fmt.Sprintf("/api/projects/%d/members/%d", pid, member.ID().Uint()),
			map[string]any{"transfer_mode": "unassigned"}, ownerToken)
		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d: %v", rec.Code, data)
		}
		// Эндпоинт Remove возвращает RemoveResult напрямую (без ключа-обёртки).
		if data["success"] != true {
			t.Fatalf("expected success:true, got %v", data)
		}
	})
}

func TestMember_RemoveWithTasks_Unassigned(t *testing.T) {
	app := testutil.NewTestApp(t)
	owner, ownerPass := app.SeedUserWithPassword(domainuser.RoleCreator, "creator123")
	member := app.SeedUser(domainuser.RoleUser)
	ownerToken, _ := app.Login(owner.Email().String(), ownerPass)

	p := app.SeedProject(owner.ID().Uint(), "team")
	pid := p.ID().Uint()

	// Добавляем участника.
	app.Do(http.MethodPost, fmt.Sprintf("/api/projects/%d/members", pid), map[string]any{
		"user_id": member.ID().Uint(),
		"role":    "executor",
	}, ownerToken)

	// Создаём задачу, назначенную участнику.
	task := app.SeedTask(pid)
	app.AssignTask(task.ID().Uint(), member.ID().Uint())

	// Удаляем в режиме unassigned.
	rec, data := app.Do(http.MethodDelete, fmt.Sprintf("/api/projects/%d/members/%d", pid, member.ID().Uint()),
		map[string]any{"transfer_mode": "unassigned"}, ownerToken)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %v", rec.Code, data)
	}

	// Проверяем, что задача снята с назначения.
	if aid := app.TaskAssignee(task.ID().Uint()); aid != nil {
		t.Fatalf("expected assignee_id to be nil after unassigned transfer, got %v", aid)
	}
}

func TestMember_RemoveWithTasks_SingleUser(t *testing.T) {
	app := testutil.NewTestApp(t)
	owner, ownerPass := app.SeedUserWithPassword(domainuser.RoleCreator, "creator123")
	member := app.SeedUser(domainuser.RoleUser)
	newAssignee := app.SeedUser(domainuser.RoleUser)
	ownerToken, _ := app.Login(owner.Email().String(), ownerPass)

	p := app.SeedProject(owner.ID().Uint(), "team")
	pid := p.ID().Uint()

	// Добавляем обоих пользователей как участников.
	app.Do(http.MethodPost, fmt.Sprintf("/api/projects/%d/members", pid), map[string]any{
		"user_id": member.ID().Uint(), "role": "executor",
	}, ownerToken)
	app.Do(http.MethodPost, fmt.Sprintf("/api/projects/%d/members", pid), map[string]any{
		"user_id": newAssignee.ID().Uint(), "role": "executor",
	}, ownerToken)

	// Создаём задачу, назначенную участнику.
	task := app.SeedTask(pid)
	app.AssignTask(task.ID().Uint(), member.ID().Uint())

	// Удаляем в режиме single_user → переназначаем всё на newAssignee.
	rec, data := app.Do(http.MethodDelete, fmt.Sprintf("/api/projects/%d/members/%d", pid, member.ID().Uint()),
		map[string]any{
			"transfer_mode":       "single_user",
			"transfer_to_user_id": newAssignee.ID().Uint(),
		}, ownerToken)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %v", rec.Code, data)
	}

	// Проверяем, что задача переназначена.
	if aid := app.TaskAssignee(task.ID().Uint()); aid == nil || *aid != newAssignee.ID().Uint() {
		t.Fatalf("expected assignee_id %d, got %v", newAssignee.ID().Uint(), aid)
	}
}

func TestMember_RemoveWithTasks_Manual(t *testing.T) {
	app := testutil.NewTestApp(t)
	owner, ownerPass := app.SeedUserWithPassword(domainuser.RoleCreator, "creator123")
	member := app.SeedUser(domainuser.RoleUser)
	newAssignee := app.SeedUser(domainuser.RoleUser)
	ownerToken, _ := app.Login(owner.Email().String(), ownerPass)

	p := app.SeedProject(owner.ID().Uint(), "team")
	pid := p.ID().Uint()

	// Добавляем обоих пользователей.
	app.Do(http.MethodPost, fmt.Sprintf("/api/projects/%d/members", pid), map[string]any{
		"user_id": member.ID().Uint(), "role": "executor",
	}, ownerToken)
	app.Do(http.MethodPost, fmt.Sprintf("/api/projects/%d/members", pid), map[string]any{
		"user_id": newAssignee.ID().Uint(), "role": "executor",
	}, ownerToken)

	// Создаём задачу, назначенную участнику.
	task := app.SeedTask(pid)
	app.AssignTask(task.ID().Uint(), member.ID().Uint())

	// Шаг 1: ручной режим возвращает задачи (участника НЕ удаляет).
	rec1, data1 := app.Do(http.MethodDelete, fmt.Sprintf("/api/projects/%d/members/%d", pid, member.ID().Uint()),
		map[string]any{"transfer_mode": "manual"}, ownerToken)
	if rec1.Code != http.StatusOK {
		t.Fatalf("step1: expected 200, got %d: %v", rec1.Code, data1)
	}
	// Ручной режим возвращает RemoveResult напрямую; success==false, т.к. участник ещё не удалён.
	if data1["success"] != false {
		t.Fatalf("step1: expected success:false (member not removed yet), got %v", data1)
	}

	// Шаг 2: применяем ручные переносы. Это также удаляет участника.
	rec2, data2 := app.Do(http.MethodPost,
		fmt.Sprintf("/api/projects/%d/members/%d/transfer-tasks", pid, member.ID().Uint()),
		map[string]any{
			"transfers": []map[string]any{
				{"task_id": task.ID().Uint(), "assignee_id": newAssignee.ID().Uint()},
			},
		}, ownerToken)
	if rec2.Code != http.StatusOK {
		t.Fatalf("step2: expected 200, got %d: %v", rec2.Code, data2)
	}
	// ApplyManualTaskTransfers удаляет участника в рамках той же операции.
	// Проверяем, что задача была переназначена.
	if aid := app.TaskAssignee(task.ID().Uint()); aid == nil || *aid != newAssignee.ID().Uint() {
		t.Fatalf("expected assignee_id %d, got %v", newAssignee.ID().Uint(), aid)
	}

	// Участник должен больше не существовать (удалён через ApplyManualTaskTransfers).
	if count := app.CountProjectMembers(pid, member.ID().Uint()); count != 0 {
		t.Fatalf("expected member to be removed after transfer, got %d rows", count)
	}
}

func TestMember_TransferOwnership(t *testing.T) {
	app := testutil.NewTestApp(t)
	// Передача владения требует роли staff или admin.
	admin, adminPass := app.SeedUserWithPassword(domainuser.RoleAdmin, "adminpass1")
	owner := app.SeedUser(domainuser.RoleCreator)
	newOwner := app.SeedUser(domainuser.RoleCreator)
	adminToken, _ := app.Login(admin.Email().String(), adminPass)

	p := app.SeedProject(owner.ID().Uint(), "team")
	pid := p.ID().Uint()

	t.Run("admin can transfer ownership", func(t *testing.T) {
		rec, data := app.Do(http.MethodPatch, fmt.Sprintf("/api/projects/%d/owner", pid),
			map[string]any{"new_owner_id": newOwner.ID().Uint()}, adminToken)
		// TransferOwnership возвращает 204 No Content (без тела).
		if rec.Code != http.StatusNoContent {
			t.Fatalf("expected 204, got %d: %v", rec.Code, data)
		}
		// Проверяем нового владельца в БД.
		if got := app.ProjectOwnerID(pid); got != newOwner.ID().Uint() {
			t.Fatalf("expected new owner_id %d, got %d", newOwner.ID().Uint(), got)
		}
	})

	t.Run("non-admin cannot transfer ownership", func(t *testing.T) {
		nonAdmin, nonAdminPass := app.SeedUserWithPassword(domainuser.RoleCreator, "creator456")
		nonAdminTok, _ := app.Login(nonAdmin.Email().String(), nonAdminPass)
		rec, _ := app.Do(http.MethodPatch, fmt.Sprintf("/api/projects/%d/owner", pid),
			map[string]any{"new_owner_id": owner.ID().Uint()}, nonAdminTok)
		if rec.Code != http.StatusForbidden {
			t.Fatalf("expected 403, got %d", rec.Code)
		}
	})
}
