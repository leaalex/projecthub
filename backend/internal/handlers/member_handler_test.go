package handlers_test

import (
	"fmt"
	"net/http"
	"testing"

	"task-manager/backend/internal/models"
	"task-manager/backend/internal/testutil"
)

func TestMember_AddUpdateRemove(t *testing.T) {
	app := testutil.NewTestApp(t)
	owner, ownerPass := app.SeedUserWithPassword(models.RoleCreator, "creator123")
	member, _ := app.SeedUserWithPassword(models.RoleUser, "userpass123")
	ownerToken := app.Login(owner.Email, ownerPass)

	p := app.SeedProject(owner.ID, models.ProjectKindTeam)
	pid := p.ID

	t.Run("add member", func(t *testing.T) {
		rec, data := app.Do(http.MethodPost, fmt.Sprintf("/api/projects/%d/members", pid), map[string]any{
			"user_id": member.ID,
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
			if uint(u["id"].(float64)) == member.ID {
				found = true
				break
			}
		}
		if !found {
			t.Fatalf("added member not in list")
		}
	})

	t.Run("update role to manager", func(t *testing.T) {
		rec, data := app.Do(http.MethodPut, fmt.Sprintf("/api/projects/%d/members/%d", pid, member.ID), map[string]any{
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
		rec, data := app.Do(http.MethodDelete, fmt.Sprintf("/api/projects/%d/members/%d", pid, member.ID),
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
	owner, ownerPass := app.SeedUserWithPassword(models.RoleCreator, "creator123")
	member := app.SeedUser(models.RoleUser)
	ownerToken := app.Login(owner.Email, ownerPass)

	p := app.SeedProject(owner.ID, models.ProjectKindTeam)
	pid := p.ID

	// Добавляем участника.
	app.Do(http.MethodPost, fmt.Sprintf("/api/projects/%d/members", pid), map[string]any{
		"user_id": member.ID,
		"role":    "executor",
	}, ownerToken)

	// Создаём задачу, назначенную участнику.
	task := app.SeedTask(pid)
	app.DB.Model(task).Update("assignee_id", member.ID)

	// Удаляем в режиме unassigned.
	rec, data := app.Do(http.MethodDelete, fmt.Sprintf("/api/projects/%d/members/%d", pid, member.ID),
		map[string]any{"transfer_mode": "unassigned"}, ownerToken)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %v", rec.Code, data)
	}

	// Проверяем, что задача снята с назначения.
	var updated models.Task
	app.DB.First(&updated, task.ID)
	if updated.AssigneeID != nil {
		t.Fatalf("expected assignee_id to be nil after unassigned transfer, got %v", updated.AssigneeID)
	}
}

func TestMember_RemoveWithTasks_SingleUser(t *testing.T) {
	app := testutil.NewTestApp(t)
	owner, ownerPass := app.SeedUserWithPassword(models.RoleCreator, "creator123")
	member := app.SeedUser(models.RoleUser)
	newAssignee := app.SeedUser(models.RoleUser)
	ownerToken := app.Login(owner.Email, ownerPass)

	p := app.SeedProject(owner.ID, models.ProjectKindTeam)
	pid := p.ID

	// Добавляем обоих пользователей как участников.
	app.Do(http.MethodPost, fmt.Sprintf("/api/projects/%d/members", pid), map[string]any{
		"user_id": member.ID, "role": "executor",
	}, ownerToken)
	app.Do(http.MethodPost, fmt.Sprintf("/api/projects/%d/members", pid), map[string]any{
		"user_id": newAssignee.ID, "role": "executor",
	}, ownerToken)

	// Создаём задачу, назначенную участнику.
	task := app.SeedTask(pid)
	app.DB.Model(task).Update("assignee_id", member.ID)

	// Удаляем в режиме single_user → переназначаем всё на newAssignee.
	rec, data := app.Do(http.MethodDelete, fmt.Sprintf("/api/projects/%d/members/%d", pid, member.ID),
		map[string]any{
			"transfer_mode":      "single_user",
			"transfer_to_user_id": newAssignee.ID,
		}, ownerToken)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %v", rec.Code, data)
	}

	// Проверяем, что задача переназначена.
	var updated models.Task
	app.DB.First(&updated, task.ID)
	if updated.AssigneeID == nil || *updated.AssigneeID != newAssignee.ID {
		t.Fatalf("expected assignee_id %d, got %v", newAssignee.ID, updated.AssigneeID)
	}
}

func TestMember_RemoveWithTasks_Manual(t *testing.T) {
	app := testutil.NewTestApp(t)
	owner, ownerPass := app.SeedUserWithPassword(models.RoleCreator, "creator123")
	member := app.SeedUser(models.RoleUser)
	newAssignee := app.SeedUser(models.RoleUser)
	ownerToken := app.Login(owner.Email, ownerPass)

	p := app.SeedProject(owner.ID, models.ProjectKindTeam)
	pid := p.ID

	// Добавляем обоих пользователей.
	app.Do(http.MethodPost, fmt.Sprintf("/api/projects/%d/members", pid), map[string]any{
		"user_id": member.ID, "role": "executor",
	}, ownerToken)
	app.Do(http.MethodPost, fmt.Sprintf("/api/projects/%d/members", pid), map[string]any{
		"user_id": newAssignee.ID, "role": "executor",
	}, ownerToken)

	// Создаём задачу, назначенную участнику.
	task := app.SeedTask(pid)
	app.DB.Model(task).Update("assignee_id", member.ID)

	// Шаг 1: ручной режим возвращает задачи (участника НЕ удаляет).
	rec1, data1 := app.Do(http.MethodDelete, fmt.Sprintf("/api/projects/%d/members/%d", pid, member.ID),
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
		fmt.Sprintf("/api/projects/%d/members/%d/transfer-tasks", pid, member.ID),
		map[string]any{
			"transfers": []map[string]any{
				{"task_id": task.ID, "assignee_id": newAssignee.ID},
			},
		}, ownerToken)
	if rec2.Code != http.StatusOK {
		t.Fatalf("step2: expected 200, got %d: %v", rec2.Code, data2)
	}
	// ApplyManualTaskTransfers удаляет участника в рамках той же операции.
	// Проверяем, что задача была переназначена.
	var updated models.Task
	app.DB.First(&updated, task.ID)
	if updated.AssigneeID == nil || *updated.AssigneeID != newAssignee.ID {
		t.Fatalf("expected assignee_id %d, got %v", newAssignee.ID, updated.AssigneeID)
	}

	// Участник должен больше не существовать (удалён через ApplyManualTaskTransfers).
	var count int64
	app.DB.Model(&models.ProjectMember{}).Where("project_id = ? AND user_id = ?", pid, member.ID).Count(&count)
	if count != 0 {
		t.Fatalf("expected member to be removed after transfer, got %d rows", count)
	}
}

func TestMember_TransferOwnership(t *testing.T) {
	app := testutil.NewTestApp(t)
	// Передача владения требует роли staff или admin.
	admin, adminPass := app.SeedUserWithPassword(models.RoleAdmin, "adminpass1")
	owner := app.SeedUser(models.RoleCreator)
	newOwner := app.SeedUser(models.RoleCreator)
	adminToken := app.Login(admin.Email, adminPass)

	p := app.SeedProject(owner.ID, models.ProjectKindTeam)
	pid := p.ID

	t.Run("admin can transfer ownership", func(t *testing.T) {
		rec, data := app.Do(http.MethodPatch, fmt.Sprintf("/api/projects/%d/owner", pid),
			map[string]any{"new_owner_id": newOwner.ID}, adminToken)
		// TransferOwnership возвращает 204 No Content (без тела).
		if rec.Code != http.StatusNoContent {
			t.Fatalf("expected 204, got %d: %v", rec.Code, data)
		}
		// Проверяем нового владельца в БД.
		var updated models.Project
		app.DB.First(&updated, pid)
		if updated.OwnerID != newOwner.ID {
			t.Fatalf("expected new owner_id %d, got %d", newOwner.ID, updated.OwnerID)
		}
	})

	t.Run("non-admin cannot transfer ownership", func(t *testing.T) {
		nonAdmin, nonAdminPass := app.SeedUserWithPassword(models.RoleCreator, "creator456")
		nonAdminTok := app.Login(nonAdmin.Email, nonAdminPass)
		rec, _ := app.Do(http.MethodPatch, fmt.Sprintf("/api/projects/%d/owner", pid),
			map[string]any{"new_owner_id": owner.ID}, nonAdminTok)
		if rec.Code != http.StatusForbidden {
			t.Fatalf("expected 403, got %d", rec.Code)
		}
	})
}
