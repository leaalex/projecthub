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
	projectSvc := &services.ProjectService{DB: db}
	taskSvc := &services.TaskService{DB: db}
	userSvc := &services.UserService{DB: db}
	reportSvc := &services.ReportService{DB: db, ReportsDir: cfg.ReportsDir}

	authHandler := &handlers.AuthHandler{Auth: authSvc}
	projectHandler := &handlers.ProjectHandler{Svc: projectSvc}
	taskHandler := &handlers.TaskHandler{Svc: taskSvc}
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
	protected.GET("/me", authHandler.Me)
	protected.POST("/me/password", authHandler.ChangePassword)

	projects := protected.Group("/projects")
	projects.GET("", projectHandler.List)
	projects.POST("", projectHandler.Create)
	projects.GET("/:id", projectHandler.Get)
	projects.PUT("/:id", projectHandler.Update)
	projects.DELETE("/:id", projectHandler.Delete)
	projects.GET("/:id/tasks", projectHandler.Tasks)

	tasks := protected.Group("/tasks")
	tasks.GET("", taskHandler.List)
	tasks.POST("", taskHandler.Create)
	tasks.GET("/:id", taskHandler.Get)
	tasks.PUT("/:id", taskHandler.Update)
	tasks.DELETE("/:id", taskHandler.Delete)
	tasks.POST("/:id/assign", taskHandler.Assign)
	tasks.POST("/:id/complete", taskHandler.Complete)

	users := protected.Group("/users")
	users.GET("", middleware.RequireAdmin(), userHandler.List)
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
