package main

import (
	"log"

	"task-manager/backend/internal/application"
	"task-manager/backend/internal/config"
	"task-manager/backend/internal/database"
	"task-manager/backend/internal/httpserver"
	"task-manager/backend/internal/infrastructure/persistence/projectstore"
	"task-manager/backend/internal/infrastructure/persistence/reportstore"
	"task-manager/backend/internal/infrastructure/persistence/sessionstore"
	"task-manager/backend/internal/infrastructure/persistence/taskstore"
	"task-manager/backend/internal/infrastructure/persistence/userstore"

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

	projectRepo := projectstore.NewGormRepository(db)
	taskRepo := taskstore.NewGormRepository(db)
	projectsSvc := application.NewProjectService(projectRepo, userRepo)
	memberRemovalSvc := application.NewMemberRemovalService(projectRepo, taskRepo, db)
	tasksSvc := application.NewTaskService(taskRepo, projectRepo, userRepo)
	taskMoveSvc := application.NewTaskMoveService(taskRepo, projectRepo, db)
	taskAssignSvc := application.NewTaskAssignService(taskRepo, projectRepo, userRepo)
	projectDelSvc := application.NewProjectDeletionService(projectRepo, taskRepo, db)

	reportRepo := reportstore.NewGormRepository(db)
	reportTaskQuery := taskstore.NewReportQuery(db)
	reportingSvc := application.NewReportingService(reportRepo, reportTaskQuery, tasksSvc, cfg.ReportsDir)

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
		Projects:          projectsSvc,
		MemberRemoval:     memberRemovalSvc,
		Tasks:             tasksSvc,
		TaskMove:          taskMoveSvc,
		TaskAssign:        taskAssignSvc,
		ProjectDeletion:   projectDelSvc,
		Reports:           reportingSvc,
	})

	addr := ":" + cfg.Port
	log.Printf("listening on %s", addr)
	if err := r.Run(addr); err != nil {
		log.Fatal(err)
	}
}
