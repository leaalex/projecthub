package config

import (
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
	Port           string
	GinMode        string
	DatabasePath   string
	ReportsDir     string
	JWTSecret      string
	JWTExpiryHrs   int
	CORSOrigin     string
	AdminEmail     string
	AdminPassword  string
	AdminName      string
}

func Load() (*Config, error) {
	_ = godotenv.Load()
	// Monorepo: `go run` from backend/ only loads ./.env; also try repo root.
	_ = godotenv.Load("../.env")

	expiry := 72
	if v := os.Getenv("JWT_EXPIRY_HOURS"); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			expiry = n
		}
	}

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

	adminEmail := strings.TrimSpace(strings.ToLower(os.Getenv("ADMIN_EMAIL")))
	adminPassword := strings.TrimSpace(os.Getenv("ADMIN_PASSWORD"))
	adminName := strings.TrimSpace(os.Getenv("ADMIN_NAME"))

	return &Config{
		Port:          port,
		GinMode:       ginMode,
		DatabasePath:  dbPath,
		ReportsDir:    reportsDir,
		JWTSecret:     secret,
		JWTExpiryHrs:  expiry,
		CORSOrigin:    cors,
		AdminEmail:    adminEmail,
		AdminPassword: adminPassword,
		AdminName:     adminName,
	}, nil
}
