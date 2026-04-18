// Package user holds the User aggregate root (IAM Aggregate) together with
// its value-objects: FullName, Email, Role, Locale.
//
// Invariants and transactional boundaries are documented in
// docs/architecture/aggregates.md (section "IAM Aggregate — User").
//
// Types are migrated here incrementally from backend/internal/models and
// backend/internal/services/user_service.go in subsequent PRs.
package user
