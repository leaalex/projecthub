package main

import (
	"log"
	"net/http"

	"task-manager/backend/internal/config"
	"task-manager/backend/internal/database"
	"task-manager/backend/internal/handlers"
	"task-manager/backend/internal/middleware"
	"task-manager/backend/internal/services"

	"github.com/gin-gonic/gin"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatal(err)
	}

	gin.SetMode(cfg.GinMode)

	db, err := database.Open(cfg.DatabasePath)
	if err != nil {
		log.Fatal(err)
	}

	if err := database.EnsureDefaultAdmin(db, cfg.AdminEmail, cfg.AdminPassword, cfg.AdminName); err != nil {
		log.Fatalf("admin seed: %v", err)
	}

	authSvc := &services.AuthService{
		DB:           db,
		JWTSecret:    cfg.JWTSecret,
		JWTExpiryHrs: cfg.JWTExpiryHrs,
	}
	memberSvc := &services.ProjectMemberService{DB: db}
	projectSvc := &services.ProjectService{DB: db, Members: memberSvc}
	taskSvc := &services.TaskService{DB: db}
	subtaskSvc := &services.SubtaskService{DB: db, Tasks: taskSvc}
	userSvc := &services.UserService{DB: db}
	reportSvc := &services.ReportService{DB: db, ReportsDir: cfg.ReportsDir}

	authHandler := &handlers.AuthHandler{Auth: authSvc}
	projectHandler := &handlers.ProjectHandler{Svc: projectSvc, Members: memberSvc, TaskSvc: taskSvc}
	memberHandler := &handlers.MemberHandler{Svc: memberSvc}
	taskHandler := &handlers.TaskHandler{Svc: taskSvc}
	subtaskHandler := &handlers.SubtaskHandler{Svc: subtaskSvc}
	userHandler := &handlers.UserHandler{Svc: userSvc}
	reportHandler := &handlers.ReportHandler{Svc: reportSvc}

	r := gin.New()
	r.Use(gin.Logger(), gin.Recovery())
	r.Use(middleware.CORS(cfg.CORSOrigin))

	api := r.Group("/api")
	api.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	auth := api.Group("/auth")
	auth.POST("/register", authHandler.Register)
	auth.POST("/login", authHandler.Login)

	protected := api.Group("")
	protected.Use(middleware.JWTAuth(cfg.JWTSecret))
	protected.Use(middleware.SyncRoleFromDB(db))
	protected.GET("/me", authHandler.Me)
	protected.POST("/me/password", authHandler.ChangePassword)

	projects := protected.Group("/projects")
	projects.GET("", projectHandler.List)
	projects.POST("", middleware.RequireCreatorOrAbove(), projectHandler.Create)
	// Register longer /:id/... routes before /:id so Gin never mis-matches paths like /:id/tasks.
	projects.GET("/:id/tasks", projectHandler.Tasks)
	projects.GET("/:id/members", memberHandler.List)
	projects.POST("/:id/members", memberHandler.Add)
	projects.PUT("/:id/members/:user_id", memberHandler.UpdateRole)
	projects.DELETE("/:id/members/:user_id", memberHandler.Remove)
	projects.PATCH("/:id/owner", middleware.RequireStaffOrAdmin(), memberHandler.TransferOwnership)
	projects.GET("/:id", projectHandler.Get)
	projects.PUT("/:id", projectHandler.Update)
	projects.DELETE("/:id", projectHandler.Delete)

	tasks := protected.Group("/tasks")
	tasks.GET("", taskHandler.List)
	tasks.POST("", middleware.RequireCreatorOrAbove(), taskHandler.Create)
	tasks.GET("/:id/subtasks", subtaskHandler.List)
	tasks.POST("/:id/subtasks", subtaskHandler.Create)
	tasks.PUT("/:id/subtasks/:sid", subtaskHandler.Update)
	tasks.DELETE("/:id/subtasks/:sid", subtaskHandler.Delete)
	tasks.POST("/:id/subtasks/:sid/toggle", subtaskHandler.Toggle)
	tasks.POST("/:id/assign", taskHandler.Assign)
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

	addr := ":" + cfg.Port
	log.Printf("listening on %s", addr)
	if err := r.Run(addr); err != nil {
		log.Fatal(err)
	}
}
