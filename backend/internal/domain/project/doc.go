// Package project holds the Project aggregate root together with its
// internal entities: ProjectMember and TaskSection.
//
// Invariants and transactional boundaries are documented in
// docs/architecture/aggregates.md (section "Project Aggregate").
//
// Types are migrated here incrementally from backend/internal/models,
// backend/internal/services/project_service.go,
// backend/internal/services/member_service.go, and
// backend/internal/services/task_section_service.go in subsequent PRs.
package project
