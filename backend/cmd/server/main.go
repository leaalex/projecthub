package main

import (
	"log"

	"task-manager/backend/internal/application"
	"task-manager/backend/internal/config"
	"task-manager/backend/internal/database"
	"task-manager/backend/internal/httpserver"
	"task-manager/backend/internal/infrastructure/persistence/sessionstore"
	"task-manager/backend/internal/infrastructure/persistence/userstore"
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

	userRepo := userstore.NewGormRepository(db)
	sessionRepo := sessionstore.NewGormRepository(db)
	authSvc := application.NewAuthService(userRepo, sessionRepo, cfg.JWTSecret, cfg.AccessTTL, cfg.RefreshTTL)
	usersSvc := application.NewUserService(userRepo)

	memberSvc := &services.ProjectMemberService{DB: db}
	projectSvc := &services.ProjectService{DB: db, Members: memberSvc}
	taskSvc := &services.TaskService{DB: db}
	sectionSvc := &services.TaskSectionService{
		DB:       db,
		Projects: projectSvc,
		Tasks:    taskSvc,
	}

	r := httpserver.BuildRouter(httpserver.Deps{
		DB:                db,
		JWTSecret:         cfg.JWTSecret,
		CORSOrigin:        cfg.CORSOrigin,
		UserRepo:          userRepo,
		Auth:              authSvc,
		Users:             usersSvc,
		RefreshCookieName: cfg.RefreshCookieName,
		RefreshCookiePath: cfg.RefreshCookiePath,
		CookieSecure:      cfg.CookieSecure,
		RefreshTTL:        cfg.RefreshTTL,
		MemberSvc:         memberSvc,
		ProjectSvc:        projectSvc,
		TaskSvc:           taskSvc,
		SectionSvc:        sectionSvc,
		SubtaskSvc:        &services.SubtaskService{DB: db, Tasks: taskSvc},
		ReportSvc:         &services.ReportService{DB: db, ReportsDir: cfg.ReportsDir},
	})

	addr := ":" + cfg.Port
	log.Printf("listening on %s", addr)
	if err := r.Run(addr); err != nil {
		log.Fatal(err)
	}
}
