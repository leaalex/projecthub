// Package task содержит корень агрегата Task вместе с внутренней
// сущностью Subtask.
//
// Инварианты и транзакционные границы задокументированы в
// docs/architecture/aggregates.md (раздел «Task Aggregate»).
//
// Типы переносятся сюда инкрементально из backend/internal/models,
// backend/internal/services/task_service.go и
// backend/internal/services/subtask_service.go в последующих PR.
package task
