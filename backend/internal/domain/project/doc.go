// Package project содержит корень агрегата Project вместе с
// внутренними сущностями: ProjectMember и TaskSection.
//
// Инварианты и транзакционные границы задокументированы в
// docs/architecture/aggregates.md (раздел «Project Aggregate»).
//
// Типы переносятся сюда инкрементально из backend/internal/models,
// backend/internal/services/project_service.go,
// backend/internal/services/member_service.go и
// backend/internal/services/task_section_service.go в последующих PR.
package project
