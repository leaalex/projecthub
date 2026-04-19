// Package project содержит корень агрегата Project вместе с
// внутренними сущностями: ProjectMember и TaskSection.
//
// Инварианты и транзакционные границы задокументированы в
// docs/architecture/aggregates.md (раздел «Project Aggregate»).
//
// Корень агрегата, участники и секции — в этом пакете; персистентность:
// internal/infrastructure/persistence/projectstore; сценарии HTTP:
// internal/application (ProjectService, MemberRemovalService).
package project
