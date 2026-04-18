package config

import (
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	Port              string
	GinMode           string
	DatabasePath      string
	ReportsDir        string
	JWTSecret         string
	AccessTTL         time.Duration
	RefreshTTL        time.Duration
	RefreshCookieName string
	RefreshCookiePath string
	CookieSecure      bool
	CORSOrigin        string
	AdminEmail        string
	AdminPassword     string
	AdminName         string
}

func Load() (*Config, error) {
	_ = godotenv.Load()
	_ = godotenv.Load("../.env")

	accessMin := 15
	if v := os.Getenv("ACCESS_TTL_MIN"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n > 0 {
			accessMin = n
		}
	}
	accessTTL := time.Duration(accessMin) * time.Minute

	refreshHrs := 168
	if v := os.Getenv("REFRESH_TTL_HOURS"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n > 0 {
			refreshHrs = n
		}
	}
	refreshTTL := time.Duration(refreshHrs) * time.Hour

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	dbPath := os.Getenv("DATABASE_PATH")
	if dbPath == "" {
		dbPath = "./storage/app.db"
	}

	reportsDir := strings.TrimSpace(os.Getenv("REPORTS_DIR"))
	if reportsDir == "" {
		reportsDir = filepath.Join(filepath.Dir(dbPath), "reports")
	}

	secret := strings.TrimSpace(os.Getenv("JWT_SECRET"))
	if secret == "" {
		secret = "dev-secret-change-in-production"
	}

	cors := os.Getenv("CORS_ORIGIN")
	if cors == "" {
		cors = "http://localhost:5173"
	}

	ginMode := os.Getenv("GIN_MODE")
	if ginMode == "" {
		ginMode = "debug"
	}

	cookieName := strings.TrimSpace(os.Getenv("REFRESH_COOKIE_NAME"))
	if cookieName == "" {
		cookieName = "refresh_token"
	}
	cookiePath := strings.TrimSpace(os.Getenv("REFRESH_COOKIE_PATH"))
	if cookiePath == "" {
		cookiePath = "/api/auth"
	}

	cookieSecure := ginMode == "release"
	if v := strings.TrimSpace(strings.ToLower(os.Getenv("REFRESH_COOKIE_SECURE"))); v != "" {
		switch v {
		case "true", "1":
			cookieSecure = true
		case "false", "0":
			cookieSecure = false
		}
	}

	adminEmail := strings.TrimSpace(strings.ToLower(os.Getenv("ADMIN_EMAIL")))
	adminPassword := strings.TrimSpace(os.Getenv("ADMIN_PASSWORD"))
	adminName := strings.TrimSpace(os.Getenv("ADMIN_NAME"))

	return &Config{
		Port:              port,
		GinMode:           ginMode,
		DatabasePath:      dbPath,
		ReportsDir:        reportsDir,
		JWTSecret:         secret,
		AccessTTL:         accessTTL,
		RefreshTTL:        refreshTTL,
		RefreshCookieName: cookieName,
		RefreshCookiePath: cookiePath,
		CookieSecure:      cookieSecure,
		CORSOrigin:        cors,
		AdminEmail:        adminEmail,
		AdminPassword:     adminPassword,
		AdminName:         adminName,
	}, nil
}
