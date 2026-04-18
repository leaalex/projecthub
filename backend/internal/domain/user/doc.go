// Package user содержит корень агрегата User (IAM-агрегат) вместе
// с его объектами-значениями: FullName, Email, Role, Locale.
//
// Инварианты и транзакционные границы задокументированы в
// docs/architecture/aggregates.md (раздел «IAM Aggregate — User»).
//
// Типы переносятся сюда инкрементально из backend/internal/models и
// backend/internal/services/user_service.go в последующих PR.
package user
