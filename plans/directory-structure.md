> [!WARNING]
> Этот документ устарел и описывает плоскую архитектуру, от которой проект отошёл в ходе DDD-миграции (апрель 2026).
> Актуальная структура **backend** — в [docs/architecture/aggregates.md](../docs/architecture/aggregates.md),
> раздел «Целевая структура пакетов». Актуальная структура **frontend** (после DDD-раскладки апрель 2026) — в [docs/architecture/frontend.md](../docs/architecture/frontend.md). Описание деревьев ниже по файлам **не** поддерживается в актуальном виде.

---

# Project Directory Structure

## Root Structure
```
task-manager/
├── backend/                 # Go backend application
├── frontend/               # Vue3 frontend application
├── docker/                 # Docker configuration files
├── docs/                   # Documentation
├── scripts/                # Utility scripts
├── plans/                  # Project planning documents
├── docker-compose.yml      # Docker Compose configuration
├── .env.example           # Environment variables template
├── .gitignore             # Git ignore rules
├── README.md              # Project documentation
└── Makefile               # Build automation
```

## Backend Structure (Go)
```
backend/
├── cmd/
│   └── server/
│       └── main.go        # Application entry point
├── internal/
│   ├── config/            # Configuration management
│   │   └── config.go
│   ├── models/            # GORM database models
│   │   ├── user.go
│   │   ├── project.go
│   │   ├── task.go
│   │   ├── subtask.go
│   │   ├── assignment.go
│   │   ├── report.go
│   │   └── time_entry.go
│   ├── repositories/      # Data access layer
│   │   ├── user_repository.go
│   │   ├── project_repository.go
│   │   ├── task_repository.go
│   │   └── report_repository.go
│   ├── services/          # Business logic layer
│   │   ├── auth_service.go
│   │   ├── user_service.go
│   │   ├── project_service.go
│   │   ├── task_service.go
│   │   └── report_service.go
│   ├── handlers/          # HTTP request handlers
│   │   ├── auth_handler.go
│   │   ├── user_handler.go
│   │   ├── project_handler.go
│   │   ├── task_handler.go
│   │   └── report_handler.go
│   ├── middleware/        # HTTP middleware
│   │   ├── auth_middleware.go
│   │   ├── logging_middleware.go
│   │   └── cors_middleware.go
│   ├── utils/             # Utility functions
│   │   ├── jwt_utils.go
│   │   ├── password_utils.go
│   │   ├── validation.go
│   │   ├── pdf_generator.go
│   │   └── excel_generator.go
│   └── database/          # Database configuration
│       ├── database.go
│       ├── migrations/
│       │   ├── 001_initial_schema.sql
│       │   └── migration_runner.go
│       └── seeds/         # Seed data
├── pkg/                   # Public packages (optional)
├── api/                   # API definitions
│   └── docs/             # OpenAPI/Swagger documentation
├── tests/                 # Test files
│   ├── unit/
│   └── integration/
├── storage/               # File storage
│   ├── uploads/          # User uploads
│   └── reports/          # Generated reports
├── go.mod                 # Go module definition
├── go.sum                 # Go dependencies checksum
└── .env                   # Environment variables
```

## Frontend Structure (Vue3)
```
frontend/
├── public/                # Static assets
│   └── index.html
├── src/
│   ├── assets/           # Images, fonts, styles
│   │   ├── css/
│   │   │   └── main.css
│   │   └── images/
│   ├── components/       # Reusable Vue components
│   │   ├── ui/           # Shared UI primitives (UiButton, UiModal, …)
│   │   ├── layout/       # Layout components
│   │   │   ├── Header.vue
│   │   │   ├── Sidebar.vue
│   │   │   └── Footer.vue
│   │   ├── auth/         # Authentication components
│   │   │   ├── LoginForm.vue
│   │   │   ├── RegisterForm.vue
│   │   │   └── ForgotPassword.vue
│   │   ├── tasks/        # Task management components
│   │   │   ├── TaskList.vue
│   │   │   ├── TaskCard.vue
│   │   │   ├── TaskForm.vue
│   │   │   └── TaskDetail.vue
│   │   ├── projects/     # Project management components
│   │   │   ├── ProjectList.vue
│   │   │   ├── ProjectCard.vue
│   │   │   └── ProjectForm.vue
│   │   ├── reports/      # Reporting components
│   │   │   ├── ReportGenerator.vue
│   │   │   ├── ReportViewer.vue
│   │   │   └── Charts/
│   │   └── dashboard/    # Dashboard components
│   │       ├── StatsCard.vue
│   │       └── ActivityFeed.vue
│   ├── composables/      # Vue composables
│   │   ├── useAuth.ts
│   │   ├── useTasks.ts
│   │   ├── useProjects.ts
│   │   └── useReports.ts
│   ├── stores/           # Pinia stores
│   │   ├── auth.store.ts
│   │   ├── task.store.ts
│   │   ├── project.store.ts
│   │   └── ui.store.ts
│   ├── router/           # Vue Router configuration
│   │   └── index.ts
│   ├── views/            # Page components
│   │   ├── Login.vue
│   │   ├── Register.vue
│   │   ├── Dashboard.vue
│   │   ├── Tasks.vue
│   │   ├── Projects.vue
│   │   ├── Reports.vue
│   │   ├── Profile.vue
│   │   └── Admin/
│   ├── utils/            # Utility functions
│   │   ├── api.ts        # API client configuration
│   │   ├── validation.ts
│   │   └── formatters.ts
│   ├── types/            # TypeScript definitions
│   │   ├── user.ts
│   │   ├── task.ts
│   │   ├── project.ts
│   │   └── api.ts
│   ├── App.vue           # Root component
│   └── main.ts           # Application entry point
├── .env                  # Frontend environment variables
├── .env.development
├── .env.production
├── vite.config.ts       # Vite configuration
├── tailwind.config.js   # Tailwind CSS configuration
├── postcss.config.js    # PostCSS configuration
├── tsconfig.json        # TypeScript configuration
├── package.json         # NPM dependencies
└── index.html           # HTML template
```

## Docker Configuration
```
docker/
├── backend/
│   ├── Dockerfile
│   └── entrypoint.sh
├── frontend/
│   └── Dockerfile
└── nginx/               # Optional reverse proxy
    └── nginx.conf
```

## Documentation Structure
```
docs/
├── api/                 # API documentation
│   ├── endpoints.md
│   └── examples.md
├── deployment/          # Deployment guides
│   ├── local.md
│   ├── docker.md
│   └── production.md
├── development/         # Development guides
│   ├── setup.md
│   ├── contributing.md
│   └── testing.md
├── user/               # User documentation
│   ├── getting-started.md
│   └── features.md
└── architecture/       # Architecture documents
    ├── database.md
    └── security.md
```

## Scripts Directory
```
scripts/
├── init-db.sh          # Database initialization
├── backup-db.sh        # Database backup
├── generate-report.sh  # Report generation script
├── deploy.sh           # Deployment script
└── test.sh             # Test runner
```

## Key Files to Create

### Backend Key Files:
1. `backend/go.mod` - Go module definition
2. `backend/internal/config/config.go` - Configuration loader
3. `backend/internal/database/database.go` - Database connection
4. `backend/internal/models/*.go` - All model definitions
5. `backend/cmd/server/main.go` - Main application entry

### Frontend Key Files:
1. `frontend/package.json` - NPM dependencies
2. `frontend/vite.config.ts` - Vite configuration
3. `frontend/tailwind.config.js` - Tailwind configuration
4. `frontend/src/main.ts` - Vue application entry
5. `frontend/src/router/index.ts` - Route definitions

### Configuration Files:
1. `.env.example` - Environment variables template
2. `docker-compose.yml` - Docker Compose setup
3. `Makefile` - Build automation commands
4. `.gitignore` - Git ignore rules

## Next Steps
1. Create the root directory structure
2. Initialize Go module in backend/
3. Create Vue3 project in frontend/
4. Set up basic configuration files
5. Implement core database models