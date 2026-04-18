// Package application contains cross-aggregate orchestrators (application
// services). Each service coordinates two or more aggregate roots within a
// single transaction, enforcing invariants that span aggregate boundaries.
//
// Services planned for this package (see docs/architecture/aggregates.md,
// section "Транзакционные границы"):
//
//   - ProjectDeletionService  — soft/hard delete of a project, cascading
//     to tasks, sections and members according to the chosen policy.
//   - MemberRemovalService    — remove a project member and reassign their
//     tasks according to the TaskTransferMode policy.
//   - TaskMoveService         — move a task between sections or projects,
//     validating that the target section belongs to the target project.
//   - TaskAssignService       — assign a user to a task after verifying
//     project membership.
//   - ReportingService        — orchestrate report generation from Task and
//     Project read-models and persist the resulting SavedReport.
//
// All of these are migrated incrementally from backend/internal/services
// in subsequent PRs.
package application
