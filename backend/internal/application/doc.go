// Package application содержит сервисы приложения (use cases).
//
// Уже здесь: AuthService, UserService, ProjectService, MemberRemovalService,
// ProjectDeletionService, TaskService, SectionItemMoveService, TaskAssignService,
// ReportingService (отчёты и сохранённые экспорты).
//
// Межагрегатные оркестраторы и транзакционные границы — см.
// docs/architecture/aggregates.md (раздел «Транзакционные границы»).
//
// Общие ошибки — `ErrForbidden` / `ErrInvalidInput` в `errors.go`
// (используются хендлерами и частью сервисов).
package application
