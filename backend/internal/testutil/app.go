// Package testutil provides helpers for integration tests.
//
// NewTestApp spins up an isolated SQLite database (one per test in t.TempDir()),
// runs the same schema migrations used in production, and wires the full Gin
// router via internal/httpserver.BuildRouter. Tests can drive the HTTP layer
// through httptest.NewRecorder without starting a network listener.
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

// TestApp is the test harness: an isolated DB and an assembled HTTP router.
type TestApp struct {
	DB     *gorm.DB
	Router *gin.Engine
	t      *testing.T
}

// NewTestApp creates an isolated TestApp for one test or sub-test.
// Each call gets its own SQLite file inside t.TempDir() so tests run in parallel.
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

// Login posts to /api/auth/login and returns the JWT token.
// Fails the test immediately if login does not return 200.
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

// Do sends an HTTP request to the test router.
//   - body is JSON-encoded if non-nil.
//   - token is added as "Authorization: Bearer <token>" if non-empty.
//
// Returns the ResponseRecorder and the parsed JSON response (nil if body is empty).
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

// SeedUser creates a user with the given role directly in the DB.
// The generated email is unique within the process; password is "password123".
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

// SeedUserWithPassword creates a user with a specific known plaintext password.
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

// SeedProject creates a project owned by ownerID.
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

// SeedTask creates a task in the given project.
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

// CountTasks returns the number of tasks with the given project_id.
// Useful for baseline assertions (e.g. tasks survive project deletion).
func (a *TestApp) CountTasks(projectID uint) int64 {
	a.t.Helper()
	var count int64
	if err := a.DB.Model(&models.Task{}).Where("project_id = ?", projectID).Count(&count).Error; err != nil {
		a.t.Fatalf("CountTasks: %v", err)
	}
	return count
}

// --- internal helpers ---

var idCounter atomic.Int64

func nextID() int64 {
	return idCounter.Add(1)
}
