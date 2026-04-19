// Package task содержит корень агрегата Task вместе с внутренней
// сущностью Subtask.
//
// Инварианты и транзакционные границы задокументированы в
// docs/architecture/aggregates.md (раздел «Task Aggregate»).
//
// Персистентность: infrastructure/persistence/taskstore; сценарии API —
// application.TaskService / TaskMoveService / TaskAssignService.
package task
