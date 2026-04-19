// Package httpserver подключает все HTTP-обработчики и middleware к Gin-движку.
// Вынесен в отдельный импортируемый пакет, чтобы тесты в internal/testutil
// использовали ту же конфигурацию роутера, что и продакшн-бинарник.
package httpserver

import (
	"net/http"
	"time"

	"task-manager/backend/internal/application"
	"task-manager/backend/internal/domain/user"
	handler "task-manager/backend/internal/interface/http"
	"task-manager/backend/internal/middleware"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// Deps содержит все зависимости, необходимые для сборки HTTP-роутера.
type Deps struct {
	DB                *gorm.DB
	JWTSecret         string
	CORSOrigin        string
	UserRepo          user.Repository
	Auth              *application.AuthService
	Users             *application.UserService
	RefreshCookieName string
	RefreshCookiePath string
	CookieSecure      bool
	RefreshTTL        time.Duration
	Projects          *application.ProjectService
	MemberRemoval     *application.MemberRemovalService
	Tasks             *application.TaskService
	TaskMove          *application.TaskMoveService
	TaskAssign        *application.TaskAssignService
	ProjectDeletion   *application.ProjectDeletionService
	Reports           *application.ReportingService
}

// BuildRouter собирает и возвращает настроенный *gin.Engine.
// Вызывающий код отвечает за r.Run() или передачу движка в httptest.
func BuildRouter(deps Deps) *gin.Engine {
	authHandler := &handler.AuthHandler{
		Auth:              deps.Auth,
		RefreshCookieName: deps.RefreshCookieName,
		RefreshCookiePath: deps.RefreshCookiePath,
		CookieSecure:      deps.CookieSecure,
		RefreshTTL:        deps.RefreshTTL,
	}
	projectHandler := &handler.ProjectHandler{
		Projects: deps.Projects,
		TaskSvc:  deps.Tasks,
		Deletion: deps.ProjectDeletion,
	}
	memberHandler := &handler.MemberHandler{Projects: deps.Projects, Removal: deps.MemberRemoval}
	taskHandler := &handler.TaskHandler{
		Tasks:     deps.Tasks,
		Move:      deps.TaskMove,
		AssignSvc: deps.TaskAssign,
		Users:     deps.UserRepo,
	}
	taskSectionHandler := &handler.TaskSectionHandler{Projects: deps.Projects}
	subtaskHandler := &handler.SubtaskHandler{Tasks: deps.Tasks}
	userHandler := &handler.UserHandler{Svc: deps.Users}
	reportHandler := &handler.ReportHandler{Svc: deps.Reports}

	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(middleware.CORS(deps.CORSOrigin))

	api := r.Group("/api")
	api.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	auth := api.Group("/auth")
	auth.POST("/register", authHandler.Register)
	auth.POST("/login", authHandler.Login)
	auth.POST("/refresh", authHandler.Refresh)
	auth.POST("/logout", authHandler.Logout)

	protected := api.Group("")
	protected.Use(middleware.JWTAuth(deps.JWTSecret))
	protected.Use(middleware.SyncRoleFromDB(deps.UserRepo))
	protected.GET("/me", authHandler.Me)
	protected.POST("/me/password", authHandler.ChangePassword)

	projects := protected.Group("/projects")
	projects.GET("", projectHandler.List)
	projects.POST("", projectHandler.Create)
	projects.GET("/:id/tasks", projectHandler.ListProjectTasks)
	projects.POST("/:id/tasks/move", taskHandler.MoveInProject)
	projects.GET("/:id/task-sections", taskSectionHandler.List)
	projects.POST("/:id/task-sections", taskSectionHandler.Create)
	projects.PUT("/:id/task-sections/:sectionId", taskSectionHandler.Update)
	projects.DELETE("/:id/task-sections/:sectionId", taskSectionHandler.Delete)
	projects.POST("/:id/task-sections/reorder", taskSectionHandler.Reorder)
	projects.GET("/:id/members", memberHandler.List)
	projects.POST("/:id/members", memberHandler.Add)
	projects.PUT("/:id/members/:user_id", memberHandler.UpdateRole)
	projects.DELETE("/:id/members/:user_id", memberHandler.Remove)
	projects.POST("/:id/members/:user_id/transfer-tasks", memberHandler.ApplyTaskTransfers)
	projects.PATCH("/:id/owner", middleware.RequireStaffOrAdmin(), memberHandler.TransferOwnership)
	projects.POST("/:id/restore", projectHandler.Restore)
	projects.GET("/:id", projectHandler.Get)
	projects.PUT("/:id", projectHandler.Update)
	projects.DELETE("/:id", projectHandler.Delete)

	tasks := protected.Group("/tasks")
	tasks.GET("", taskHandler.List)
	tasks.POST("", taskHandler.Create)
	tasks.GET("/:id/subtasks", subtaskHandler.List)
	tasks.POST("/:id/subtasks", subtaskHandler.Create)
	tasks.PUT("/:id/subtasks/:sid", subtaskHandler.Update)
	tasks.DELETE("/:id/subtasks/:sid", subtaskHandler.Delete)
	tasks.POST("/:id/subtasks/:sid/toggle", subtaskHandler.Toggle)
	tasks.POST("/:id/assign", taskHandler.AssignUser)
	tasks.POST("/:id/complete", taskHandler.Complete)
	tasks.GET("/:id", taskHandler.Get)
	tasks.PUT("/:id", taskHandler.Update)
	tasks.DELETE("/:id", taskHandler.Delete)

	users := protected.Group("/users")
	users.GET("", middleware.RequireStaffOrAdmin(), userHandler.List)
	users.POST("", middleware.RequireAdmin(), userHandler.Create)
	users.PATCH("/:id/role", middleware.RequireAdmin(), userHandler.SetRole)
	users.GET("/:id", userHandler.Get)
	users.PUT("/:id", userHandler.Update)
	users.DELETE("/:id", middleware.RequireAdmin(), userHandler.Delete)

	reports := protected.Group("/reports")
	reports.GET("/weekly", reportHandler.Weekly)
	reports.GET("/exports", reportHandler.ListExports)
	reports.GET("/exports/:id/download", reportHandler.DownloadExport)
	reports.DELETE("/exports/:id", reportHandler.DeleteExport)
	reports.POST("/generate", reportHandler.Generate)

	return r
}
