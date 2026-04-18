// Package task holds the Task aggregate root together with its internal
// entity Subtask.
//
// Invariants and transactional boundaries are documented in
// docs/architecture/aggregates.md (section "Task Aggregate").
//
// Types are migrated here incrementally from backend/internal/models,
// backend/internal/services/task_service.go, and
// backend/internal/services/subtask_service.go in subsequent PRs.
package task
