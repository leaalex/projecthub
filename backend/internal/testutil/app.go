// Package testutil предоставляет вспомогательные средства для интеграционных тестов.
//
// NewTestApp поднимает изолированную базу данных SQLite (по одной на тест в t.TempDir()),
// выполняет те же миграции схемы, что и в продакшне, и подключает полный Gin-роутер
// через internal/httpserver.BuildRouter. Тесты могут работать с HTTP-слоем
// через httptest.NewRecorder без запуска сетевого слушателя.
package testutil

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"sync/atomic"
	"testing"
	"time"

	"task-manager/backend/internal/application"
	"task-manager/backend/internal/database"
	"task-manager/backend/internal/domain/project"
	"task-manager/backend/internal/domain/task"
	"task-manager/backend/internal/domain/user"
	"task-manager/backend/internal/httpserver"
	"task-manager/backend/internal/infrastructure/persistence/notestore"
	"task-manager/backend/internal/infrastructure/persistence/projectstore"
	"task-manager/backend/internal/infrastructure/persistence/reportstore"
	"task-manager/backend/internal/infrastructure/persistence/sessionstore"
	"task-manager/backend/internal/infrastructure/persistence/taskstore"
	"task-manager/backend/internal/infrastructure/persistence/userstore"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

const testJWTSecret = "test-secret-do-not-use-in-prod"
const testRefreshCookieName = "refresh_token"

// TestApp — тестовый стенд: изолированная БД и собранный HTTP-роутер.
type TestApp struct {
	DB          *gorm.DB
	Router      *gin.Engine
	UserRepo    *userstore.GormRepository
	ProjectRepo *projectstore.GormRepository
	TaskRepo    *taskstore.GormRepository
	t           *testing.T
}

// NewTestApp создаёт изолированный TestApp для одного теста или суб-теста.
func NewTestApp(t *testing.T) *TestApp {
	t.Helper()
	gin.SetMode(gin.TestMode)

	dbPath := filepath.Join(t.TempDir(), "test.db")
	db, err := database.Open(dbPath)
	if err != nil {
		t.Fatalf("testutil.NewTestApp: open db: %v", err)
	}

	userRepo := userstore.NewGormRepository(db)
	sessionRepo := sessionstore.NewGormRepository(db)
	accessTTL := 24 * time.Hour
	refreshTTL := 24 * time.Hour

	authSvc := application.NewAuthService(userRepo, sessionRepo, testJWTSecret, accessTTL, refreshTTL)
	usersSvc := application.NewUserService(userRepo)

	projectRepo := projectstore.NewGormRepository(db)
	taskRepo := taskstore.NewGormRepository(db)
	projectsSvc := application.NewProjectService(projectRepo, userRepo)
	memberRemovalSvc := application.NewMemberRemovalService(projectRepo, taskRepo, db)
	tasksSvc := application.NewTaskService(taskRepo, projectRepo, userRepo)
	taskAssignSvc := application.NewTaskAssignService(taskRepo, projectRepo, userRepo)
	projectDelSvc := application.NewProjectDeletionService(projectRepo, taskRepo, db)
	noteRepo := notestore.NewGormRepository(db)
	noteSvc := application.NewNoteService(noteRepo, taskRepo, projectRepo)
	sectionItemMoveSvc := application.NewSectionItemMoveService(taskRepo, noteRepo, projectRepo, db)
	taskTrashSvc := application.NewTaskTrashService(taskRepo, projectRepo)

	router := httpserver.BuildRouter(httpserver.Deps{
		DB:                db,
		JWTSecret:         testJWTSecret,
		CORSOrigin:        "http://localhost:5173",
		UserRepo:          userRepo,
		Auth:              authSvc,
		Users:             usersSvc,
		RefreshCookieName: testRefreshCookieName,
		RefreshCookiePath: "/api/auth",
		CookieSecure:      false,
		RefreshTTL:        refreshTTL,
		Projects:          projectsSvc,
		MemberRemoval:     memberRemovalSvc,
		Tasks:             tasksSvc,
		SectionItemMove:   sectionItemMoveSvc,
		TaskAssign:        taskAssignSvc,
		TaskTrash:         taskTrashSvc,
		ProjectDeletion:   projectDelSvc,
		Notes:             noteSvc,
		Reports: application.NewReportingService(
			reportstore.NewGormRepository(db),
			taskstore.NewReportQuery(db),
			tasksSvc,
			t.TempDir(),
		),
	})

	return &TestApp{
		DB:          db,
		Router:      router,
		UserRepo:    userRepo,
		ProjectRepo: projectRepo,
		TaskRepo:    taskRepo,
		t:           t,
	}
}

// Login выполняет POST /api/auth/login и возвращает access-токен и cookie refresh (если есть).
func (a *TestApp) Login(email, password string) (access string, refresh *http.Cookie) {
	a.t.Helper()
	body := map[string]string{"email": email, "password": password}
	rec, data := a.Do(http.MethodPost, "/api/auth/login", body, "")
	if rec.Code != http.StatusOK {
		a.t.Fatalf("Login(%s): expected 200, got %d: %v", email, rec.Code, data)
	}
	tok, ok := data["access_token"].(string)
	if !ok || tok == "" {
		a.t.Fatalf("Login(%s): no access_token in response: %v", email, data)
	}
	resp := rec.Result()
	defer resp.Body.Close()
	for _, ck := range resp.Cookies() {
		if ck.Name == testRefreshCookieName {
			refresh = ck
			break
		}
	}
	return tok, refresh
}

// Do отправляет HTTP-запрос к тестовому роутеру.
//   - body JSON-кодируется, если не nil.
//   - accessToken добавляется как "Authorization: Bearer <token>", если не пуст.
//
// Возвращает ResponseRecorder и разобранный JSON-ответ (nil, если тело пусто).
func (a *TestApp) Do(method, path string, body any, accessToken string) (*httptest.ResponseRecorder, map[string]any) {
	return a.DoWithCookie(method, path, body, accessToken, nil)
}

// DoWithCookie — как Do, но опционально добавляет refresh-cookie.
func (a *TestApp) DoWithCookie(method, path string, body any, accessToken string, refresh *http.Cookie) (*httptest.ResponseRecorder, map[string]any) {
	a.t.Helper()

	var req *http.Request
	if body != nil {
		b, err := json.Marshal(body)
		if err != nil {
			a.t.Fatalf("Do: json.Marshal: %v", err)
		}
		req = httptest.NewRequest(method, path, bytes.NewReader(b))
		req.Header.Set("Content-Type", "application/json")
	} else {
		req = httptest.NewRequest(method, path, nil)
	}
	if accessToken != "" {
		req.Header.Set("Authorization", "Bearer "+accessToken)
	}
	if refresh != nil {
		req.AddCookie(refresh)
	}

	rec := httptest.NewRecorder()
	a.Router.ServeHTTP(rec, req)

	var result map[string]any
	if rec.Body.Len() > 0 {
		_ = json.Unmarshal(rec.Body.Bytes(), &result)
	}
	return rec, result
}

// SeedUser создаёт пользователя с заданной ролью непосредственно в БД.
func (a *TestApp) SeedUser(role user.Role) *user.User {
	a.t.Helper()
	n := nextID()
	hash, err := user.HashPassword("password123")
	if err != nil {
		a.t.Fatalf("SeedUser: hash: %v", err)
	}
	email, err := user.NewEmail(fmt.Sprintf("user%d@test.example", n))
	if err != nil {
		a.t.Fatalf("SeedUser: email: %v", err)
	}
	u, err := user.NewUser(email, hash, user.FullName{FirstName: fmt.Sprintf("User%d", n)}, role)
	if err != nil {
		a.t.Fatalf("SeedUser: %v", err)
	}
	u.Touch(time.Now())
	if err := a.UserRepo.Save(context.Background(), u); err != nil {
		a.t.Fatalf("SeedUser: %v", err)
	}
	loaded, err := a.UserRepo.FindByID(context.Background(), u.ID())
	if err != nil {
		a.t.Fatalf("SeedUser reload: %v", err)
	}
	return loaded
}

// SeedUserWithPassword создаёт пользователя с конкретным известным паролем.
func (a *TestApp) SeedUserWithPassword(role user.Role, password string) (u *user.User, plainPassword string) {
	a.t.Helper()
	n := nextID()
	hash, err := user.HashPassword(password)
	if err != nil {
		a.t.Fatalf("SeedUserWithPassword: hash: %v", err)
	}
	email, err := user.NewEmail(fmt.Sprintf("user%d@test.example", n))
	if err != nil {
		a.t.Fatalf("SeedUserWithPassword: email: %v", err)
	}
	usr, err := user.NewUser(email, hash, user.FullName{FirstName: fmt.Sprintf("User%d", n)}, role)
	if err != nil {
		a.t.Fatalf("SeedUserWithPassword: %v", err)
	}
	usr.Touch(time.Now())
	if err := a.UserRepo.Save(context.Background(), usr); err != nil {
		a.t.Fatalf("SeedUserWithPassword: %v", err)
	}
	loaded, err := a.UserRepo.FindByID(context.Background(), usr.ID())
	if err != nil {
		a.t.Fatalf("SeedUserWithPassword reload: %v", err)
	}
	return loaded, password
}

// SeedProject создаёт проект, принадлежащий ownerID (kind: "team" или "personal").
func (a *TestApp) SeedProject(ownerID uint, kindStr string) *project.Project {
	a.t.Helper()
	ctx := context.Background()
	owner, err := a.UserRepo.FindByID(ctx, user.ID(ownerID))
	if err != nil {
		a.t.Fatalf("SeedProject: owner: %v", err)
	}
	kind, err := project.ParseKind(kindStr)
	if err != nil {
		a.t.Fatalf("SeedProject: kind: %v", err)
	}
	n := nextID()
	p, err := project.NewProject(user.ID(ownerID), owner.Role(), fmt.Sprintf("Project%d", n), "", kind)
	if err != nil {
		a.t.Fatalf("SeedProject: %v", err)
	}
	p.Touch(time.Now())
	if err := a.ProjectRepo.Save(ctx, p); err != nil {
		a.t.Fatalf("SeedProject: save: %v", err)
	}
	loaded, err := a.ProjectRepo.FindByID(ctx, p.ID())
	if err != nil {
		a.t.Fatalf("SeedProject: reload: %v", err)
	}
	return loaded
}

// SeedTask создаёт задачу в заданном проекте.
func (a *TestApp) SeedTask(projectID uint) *task.Task {
	a.t.Helper()
	ctx := context.Background()
	pid := project.ID(projectID)
	pos, err := a.TaskRepo.NextPosition(ctx, pid, nil)
	if err != nil {
		a.t.Fatalf("SeedTask: NextPosition: %v", err)
	}
	st, err := task.ParseStatus("todo")
	if err != nil {
		a.t.Fatalf("SeedTask: status: %v", err)
	}
	pr, err := task.ParsePriority("medium")
	if err != nil {
		a.t.Fatalf("SeedTask: priority: %v", err)
	}
	n := nextID()
	tk, err := task.NewTask(pid, nil, fmt.Sprintf("Task%d", n), "", st, pr, pos, nil, time.Now())
	if err != nil {
		a.t.Fatalf("SeedTask: NewTask: %v", err)
	}
	if err := a.TaskRepo.Save(ctx, tk); err != nil {
		a.t.Fatalf("SeedTask: save: %v", err)
	}
	loaded, err := a.TaskRepo.FindByID(ctx, tk.ID())
	if err != nil {
		a.t.Fatalf("SeedTask: reload: %v", err)
	}
	return loaded
}

// AssignTask назначает исполнителя задачи (для тестов).
func (a *TestApp) AssignTask(taskID uint, assigneeUserID uint) {
	a.t.Helper()
	ctx := context.Background()
	tk, err := a.TaskRepo.FindByID(ctx, task.ID(taskID))
	if err != nil {
		a.t.Fatalf("AssignTask: %v", err)
	}
	uid := user.ID(assigneeUserID)
	tk.Assign(&uid, time.Now())
	if err := a.TaskRepo.Save(ctx, tk); err != nil {
		a.t.Fatalf("AssignTask: save: %v", err)
	}
}

// TaskAssignee возвращает assignee_id задачи или nil.
func (a *TestApp) TaskAssignee(taskID uint) *uint {
	a.t.Helper()
	ctx := context.Background()
	tk, err := a.TaskRepo.FindByID(ctx, task.ID(taskID))
	if err != nil {
		a.t.Fatalf("TaskAssignee: %v", err)
	}
	if aid := tk.AssigneeID(); aid != nil {
		v := aid.Uint()
		return &v
	}
	return nil
}

// CountSubtasks — число подзадач у задачи.
func (a *TestApp) CountSubtasks(taskID uint) int64 {
	a.t.Helper()
	var count int64
	if err := a.DB.Model(&taskstore.SubtaskRecord{}).Where("task_id = ?", taskID).Count(&count).Error; err != nil {
		a.t.Fatalf("CountSubtasks: %v", err)
	}
	return count
}

// CountProjectMembers — число строк project_members для пары (project, user).
func (a *TestApp) CountProjectMembers(projectID, userID uint) int64 {
	a.t.Helper()
	var count int64
	if err := a.DB.Model(&projectstore.MemberRecord{}).
		Where("project_id = ? AND user_id = ?", projectID, userID).
		Count(&count).Error; err != nil {
		a.t.Fatalf("CountProjectMembers: %v", err)
	}
	return count
}

// ProjectOwnerID возвращает owner_id проекта.
func (a *TestApp) ProjectOwnerID(projectID uint) uint {
	a.t.Helper()
	ctx := context.Background()
	p, err := a.ProjectRepo.FindByID(ctx, project.ID(projectID))
	if err != nil {
		a.t.Fatalf("ProjectOwnerID: %v", err)
	}
	return p.OwnerID().Uint()
}

// CountTasks возвращает количество задач с заданным project_id.
func (a *TestApp) CountTasks(projectID uint) int64 {
	a.t.Helper()
	var count int64
	if err := a.DB.Model(&taskstore.TaskRecord{}).Where("project_id = ?", projectID).Count(&count).Error; err != nil {
		a.t.Fatalf("CountTasks: %v", err)
	}
	return count
}

var idCounter atomic.Int64

func nextID() int64 {
	return idCounter.Add(1)
}
