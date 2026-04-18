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
	"task-manager/backend/internal/domain/user"
	"task-manager/backend/internal/httpserver"
	"task-manager/backend/internal/infrastructure/persistence/sessionstore"
	"task-manager/backend/internal/infrastructure/persistence/userstore"
	"task-manager/backend/internal/models"
	"task-manager/backend/internal/services"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

const testJWTSecret = "test-secret-do-not-use-in-prod"
const testRefreshCookieName = "refresh_token"

// TestApp — тестовый стенд: изолированная БД и собранный HTTP-роутер.
type TestApp struct {
	DB       *gorm.DB
	Router   *gin.Engine
	UserRepo *userstore.GormRepository
	t        *testing.T
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

	memberSvc := &services.ProjectMemberService{DB: db}
	projectSvc := &services.ProjectService{DB: db, Members: memberSvc}
	taskSvc := &services.TaskService{DB: db}
	sectionSvc := &services.TaskSectionService{
		DB:       db,
		Projects: projectSvc,
		Tasks:    taskSvc,
	}

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
		MemberSvc:         memberSvc,
		ProjectSvc:        projectSvc,
		TaskSvc:           taskSvc,
		SectionSvc:        sectionSvc,
		SubtaskSvc:        &services.SubtaskService{DB: db, Tasks: taskSvc},
		ReportSvc:         &services.ReportService{DB: db, ReportsDir: t.TempDir()},
	})

	return &TestApp{DB: db, Router: router, UserRepo: userRepo, t: t}
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

// SeedProject создаёт проект, принадлежащий ownerID.
func (a *TestApp) SeedProject(ownerID uint, kind models.ProjectKind) *models.Project {
	a.t.Helper()
	n := nextID()
	p := &models.Project{
		Name:    fmt.Sprintf("Project%d", n),
		OwnerID: ownerID,
		Kind:    kind,
	}
	if err := a.DB.Create(p).Error; err != nil {
		a.t.Fatalf("SeedProject: %v", err)
	}
	return p
}

// SeedTask создаёт задачу в заданном проекте.
func (a *TestApp) SeedTask(projectID uint) *models.Task {
	a.t.Helper()
	n := nextID()
	task := &models.Task{
		Title:     fmt.Sprintf("Task%d", n),
		ProjectID: projectID,
		Status:    models.StatusTodo,
		Priority:  models.PriorityMedium,
	}
	if err := a.DB.Create(task).Error; err != nil {
		a.t.Fatalf("SeedTask: %v", err)
	}
	return task
}

// CountTasks возвращает количество задач с заданным project_id.
func (a *TestApp) CountTasks(projectID uint) int64 {
	a.t.Helper()
	var count int64
	if err := a.DB.Model(&models.Task{}).Where("project_id = ?", projectID).Count(&count).Error; err != nil {
		a.t.Fatalf("CountTasks: %v", err)
	}
	return count
}

var idCounter atomic.Int64

func nextID() int64 {
	return idCounter.Add(1)
}
