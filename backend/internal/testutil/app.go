// Package testutil предоставляет вспомогательные средства для интеграционных тестов.
//
// NewTestApp поднимает изолированную базу данных SQLite (по одной на тест в t.TempDir()),
// выполняет те же миграции схемы, что и в продакшне, и подключает полный Gin-роутер
// через internal/httpserver.BuildRouter. Тесты могут работать с HTTP-слоем
// через httptest.NewRecorder без запуска сетевого слушателя.
package testutil

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"sync/atomic"
	"testing"

	"task-manager/backend/internal/database"
	"task-manager/backend/internal/httpserver"
	"task-manager/backend/internal/models"
	"task-manager/backend/internal/services"
	"task-manager/backend/internal/utils"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

const testJWTSecret = "test-secret-do-not-use-in-prod"
const testJWTExpiryHrs = 24

// TestApp — тестовый стенд: изолированная БД и собранный HTTP-роутер.
type TestApp struct {
	DB     *gorm.DB
	Router *gin.Engine
	t      *testing.T
}

// NewTestApp создаёт изолированный TestApp для одного теста или суб-теста.
// Каждый вызов получает свой файл SQLite внутри t.TempDir(), так что тесты выполняются параллельно.
func NewTestApp(t *testing.T) *TestApp {
	t.Helper()
	gin.SetMode(gin.TestMode)

	dbPath := filepath.Join(t.TempDir(), "test.db")
	db, err := database.Open(dbPath)
	if err != nil {
		t.Fatalf("testutil.NewTestApp: open db: %v", err)
	}

	memberSvc := &services.ProjectMemberService{DB: db}
	projectSvc := &services.ProjectService{DB: db, Members: memberSvc}
	taskSvc := &services.TaskService{DB: db}
	sectionSvc := &services.TaskSectionService{
		DB:       db,
		Projects: projectSvc,
		Tasks:    taskSvc,
	}

	router := httpserver.BuildRouter(httpserver.Deps{
		DB:         db,
		JWTSecret:  testJWTSecret,
		CORSOrigin: "*",
		AuthSvc: &services.AuthService{
			DB:           db,
			JWTSecret:    testJWTSecret,
			JWTExpiryHrs: testJWTExpiryHrs,
		},
		MemberSvc:  memberSvc,
		ProjectSvc: projectSvc,
		TaskSvc:    taskSvc,
		SectionSvc: sectionSvc,
		SubtaskSvc: &services.SubtaskService{DB: db, Tasks: taskSvc},
		UserSvc:    &services.UserService{DB: db},
		ReportSvc:  &services.ReportService{DB: db, ReportsDir: t.TempDir()},
	})

	return &TestApp{DB: db, Router: router, t: t}
}

// Login выполняет POST /api/auth/login и возвращает JWT-токен.
// Немедленно проваливает тест, если вход не вернул 200.
func (a *TestApp) Login(email, password string) string {
	a.t.Helper()
	body := map[string]string{"email": email, "password": password}
	rec, data := a.Do(http.MethodPost, "/api/auth/login", body, "")
	if rec.Code != http.StatusOK {
		a.t.Fatalf("Login(%s): expected 200, got %d: %v", email, rec.Code, data)
	}
	token, ok := data["token"].(string)
	if !ok || token == "" {
		a.t.Fatalf("Login(%s): no token in response: %v", email, data)
	}
	return token
}

// Do отправляет HTTP-запрос к тестовому роутеру.
//   - body JSON-кодируется, если не nil.
//   - token добавляется как "Authorization: Bearer <token>", если не пуст.
//
// Возвращает ResponseRecorder и разобранный JSON-ответ (nil, если тело пусто).
func (a *TestApp) Do(method, path string, body any, token string) (*httptest.ResponseRecorder, map[string]any) {
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
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
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
// Генерируемый email уникален в пределах процесса; пароль — "password123".
func (a *TestApp) SeedUser(role models.Role) *models.User {
	a.t.Helper()
	n := nextID()
	hash, err := utils.HashPassword("password123")
	if err != nil {
		a.t.Fatalf("SeedUser: hash: %v", err)
	}
	u := &models.User{
		Email:        fmt.Sprintf("user%d@test.example", n),
		PasswordHash: hash,
		FirstName:    fmt.Sprintf("User%d", n),
		Role:         role,
	}
	models.SyncNameFromFIO(u)
	if err := a.DB.Create(u).Error; err != nil {
		a.t.Fatalf("SeedUser: %v", err)
	}
	return u
}

// SeedUserWithPassword создаёт пользователя с конкретным известным паролем.
func (a *TestApp) SeedUserWithPassword(role models.Role, password string) (user *models.User, plainPassword string) {
	a.t.Helper()
	n := nextID()
	hash, err := utils.HashPassword(password)
	if err != nil {
		a.t.Fatalf("SeedUserWithPassword: hash: %v", err)
	}
	u := &models.User{
		Email:        fmt.Sprintf("user%d@test.example", n),
		PasswordHash: hash,
		FirstName:    fmt.Sprintf("User%d", n),
		Role:         role,
	}
	models.SyncNameFromFIO(u)
	if err := a.DB.Create(u).Error; err != nil {
		a.t.Fatalf("SeedUserWithPassword: %v", err)
	}
	return u, password
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
// Используется для базовых проверок (например, задачи сохраняются после удаления проекта).
func (a *TestApp) CountTasks(projectID uint) int64 {
	a.t.Helper()
	var count int64
	if err := a.DB.Model(&models.Task{}).Where("project_id = ?", projectID).Count(&count).Error; err != nil {
		a.t.Fatalf("CountTasks: %v", err)
	}
	return count
}

// --- внутренние вспомогательные функции ---

var idCounter atomic.Int64

func nextID() int64 {
	return idCounter.Add(1)
}
