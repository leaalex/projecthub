package application

import (
	"context"
	"time"

	"task-manager/backend/internal/domain/note"
	"task-manager/backend/internal/domain/project"
	"task-manager/backend/internal/domain/task"
	"task-manager/backend/internal/domain/user"
)

// NoteCreate — параметры создания заметки.
type NoteCreate struct {
	ProjectID uint
	SectionID *uint
	Title     string
	Body      string
}

// NoteUpdate — параметры обновления заметки.
type NoteUpdate struct {
	Title *string
	Body  *string
}

// NoteService — сценарии CRUD заметок с ACL.
type NoteService struct {
	Notes    note.Repository
	Tasks    task.Repository
	Projects project.Repository
	Clock    func() time.Time
}

// NewNoteService создаёт сервис. Clock по умолчанию — time.Now.
func NewNoteService(notes note.Repository, tasks task.Repository, projects project.Repository) *NoteService {
	return &NoteService{
		Notes:    notes,
		Tasks:    tasks,
		Projects: projects,
		Clock:    time.Now,
	}
}

// canManage проверяет: владелец, системная роль или участник с ролью manager.
func (s *NoteService) canManage(ctx context.Context, projectID, callerID uint, role user.Role) (bool, error) {
	if user.IsSystemRole(role) {
		return true, nil
	}
	ok, err := s.Projects.IsOwner(ctx, project.ID(projectID), user.ID(callerID))
	if err != nil || ok {
		return ok, err
	}
	r, has, err := s.Projects.GetMemberRole(ctx, project.ID(projectID), user.ID(callerID))
	if err != nil || !has {
		return false, err
	}
	return r == project.RoleManager, nil
}

// canView проверяет доступ на чтение: участник или владелец проекта.
func (s *NoteService) canView(ctx context.Context, projectID, callerID uint, role user.Role) (bool, error) {
	if user.IsSystemRole(role) {
		return true, nil
	}
	ok, err := s.Projects.IsOwner(ctx, project.ID(projectID), user.ID(callerID))
	if err != nil || ok {
		return ok, err
	}
	_, has, err := s.Projects.GetMemberRole(ctx, project.ID(projectID), user.ID(callerID))
	return has, err
}

func (s *NoteService) ensureNoteSectionInProject(ctx context.Context, pid project.ID, sectionID *project.SectionID) error {
	if sectionID == nil {
		return nil
	}
	p, err := s.Projects.FindByID(ctx, pid)
	if err != nil {
		return err
	}
	if p.SectionByID(*sectionID) == nil {
		return project.ErrSectionNotFound
	}
	return nil
}

// Create создаёт новую заметку (требует manage-доступа).
func (s *NoteService) Create(ctx context.Context, callerID uint, role user.Role, input NoteCreate) (*note.Note, error) {
	ok, err := s.canManage(ctx, input.ProjectID, callerID, role)
	if err != nil {
		return nil, err
	}
	if !ok {
		return nil, ErrForbidden
	}

	pid := project.ID(input.ProjectID)
	var secID *project.SectionID
	if input.SectionID != nil {
		s2 := project.SectionID(*input.SectionID)
		secID = &s2
	}
	if err := s.ensureNoteSectionInProject(ctx, pid, secID); err != nil {
		return nil, err
	}

	pos, err := s.Notes.NextPosition(ctx, pid, secID)
	if err != nil {
		return nil, err
	}

	n, err := note.NewNote(pid, secID, user.ID(callerID), input.Title, input.Body, pos, s.Clock())
	if err != nil {
		return nil, err
	}
	if err := s.Notes.Save(ctx, n); err != nil {
		return nil, err
	}
	return n, nil
}

// Get возвращает заметку (требует view-доступа).
func (s *NoteService) Get(ctx context.Context, noteID, callerID uint, role user.Role) (*note.Note, error) {
	n, err := s.Notes.FindByID(ctx, note.ID(noteID))
	if err != nil {
		return nil, err
	}
	ok, err := s.canView(ctx, n.ProjectID().Uint(), callerID, role)
	if err != nil {
		return nil, err
	}
	if !ok {
		return nil, ErrForbidden
	}
	return n, nil
}

// List возвращает живые заметки проекта.
func (s *NoteService) List(ctx context.Context, projectID, callerID uint, role user.Role) ([]*note.Note, error) {
	ok, err := s.canView(ctx, projectID, callerID, role)
	if err != nil {
		return nil, err
	}
	if !ok {
		return nil, ErrForbidden
	}
	return s.Notes.ListByProject(ctx, project.ID(projectID))
}

// visibleProjectIDs — проекты, где пользователь владелец или участник (как у задач).
func (s *NoteService) visibleProjectIDs(ctx context.Context, userID uint) ([]uint, error) {
	uid := user.ID(userID)
	owned, err := s.Projects.ListOwnedProjectIDs(ctx, uid)
	if err != nil {
		return nil, err
	}
	memberships, err := s.Projects.ListMemberships(ctx, uid)
	if err != nil {
		return nil, err
	}
	members := make([]uint, len(memberships))
	for i, id := range memberships {
		members[i] = id.Uint()
	}
	return unionUintIDs(owned, members), nil
}

// ListVisible возвращает живые заметки по всем видимым проектам (опционально один project_id).
func (s *NoteService) ListVisible(ctx context.Context, callerID uint, role user.Role, projectID *uint) ([]*note.Note, error) {
	f := note.ListFilter{CallerIsSystem: user.IsSystemRole(role)}
	if !f.CallerIsSystem {
		vis, err := s.visibleProjectIDs(ctx, callerID)
		if err != nil {
			return nil, err
		}
		f.VisibleProjectIDs = vis
	}
	if projectID != nil {
		pid := project.ID(*projectID)
		f.ProjectID = &pid
	}
	return s.Notes.ListVisible(ctx, f)
}

// Update обновляет заголовок и/или тело заметки.
func (s *NoteService) Update(ctx context.Context, noteID, callerID uint, role user.Role, input NoteUpdate) (*note.Note, error) {
	n, err := s.Notes.FindByID(ctx, note.ID(noteID))
	if err != nil {
		return nil, err
	}
	ok, err := s.canManage(ctx, n.ProjectID().Uint(), callerID, role)
	if err != nil {
		return nil, err
	}
	if !ok {
		return nil, ErrForbidden
	}
	now := s.Clock()
	if input.Title != nil {
		if err := n.Rename(*input.Title, now); err != nil {
			return nil, err
		}
	}
	if input.Body != nil {
		n.SetBody(*input.Body, now)
	}
	if err := s.Notes.Save(ctx, n); err != nil {
		return nil, err
	}
	return n, nil
}

// SoftDelete мягко удаляет заметку.
func (s *NoteService) SoftDelete(ctx context.Context, noteID, callerID uint, role user.Role) error {
	n, err := s.Notes.FindByID(ctx, note.ID(noteID))
	if err != nil {
		return err
	}
	ok, err := s.canManage(ctx, n.ProjectID().Uint(), callerID, role)
	if err != nil {
		return err
	}
	if !ok {
		return ErrForbidden
	}
	return s.Notes.SoftDelete(ctx, note.ID(noteID))
}

// Restore снимает мягкое удаление.
func (s *NoteService) Restore(ctx context.Context, noteID, callerID uint, role user.Role) error {
	n, err := s.Notes.FindByIDUnscoped(ctx, note.ID(noteID))
	if err != nil {
		return err
	}
	ok, err := s.canManage(ctx, n.ProjectID().Uint(), callerID, role)
	if err != nil {
		return err
	}
	if !ok {
		return ErrForbidden
	}
	return s.Notes.Restore(ctx, note.ID(noteID))
}

// RestoreInProject как Restore, но сверяет project_id из URL с заметкой (в т.ч. для записей в корзине).
func (s *NoteService) RestoreInProject(ctx context.Context, projectID, noteID, callerID uint, role user.Role) error {
	n, err := s.Notes.FindByIDUnscoped(ctx, note.ID(noteID))
	if err != nil {
		return err
	}
	if n.ProjectID().Uint() != projectID {
		return note.ErrNoteNotFound
	}
	ok, err := s.canManage(ctx, n.ProjectID().Uint(), callerID, role)
	if err != nil {
		return err
	}
	if !ok {
		return ErrForbidden
	}
	return s.Notes.Restore(ctx, note.ID(noteID))
}

// HardDelete физически удаляет заметку.
func (s *NoteService) HardDelete(ctx context.Context, noteID, callerID uint, role user.Role) error {
	n, err := s.Notes.FindByIDUnscoped(ctx, note.ID(noteID))
	if err != nil {
		return err
	}
	ok, err := s.canManage(ctx, n.ProjectID().Uint(), callerID, role)
	if err != nil {
		return err
	}
	if !ok {
		return ErrForbidden
	}
	return s.Notes.HardDelete(ctx, note.ID(noteID))
}

// HardDeleteInProject как HardDelete, но сверяет project_id из URL (для заметок в корзине).
func (s *NoteService) HardDeleteInProject(ctx context.Context, projectID, noteID, callerID uint, role user.Role) error {
	n, err := s.Notes.FindByIDUnscoped(ctx, note.ID(noteID))
	if err != nil {
		return err
	}
	if n.ProjectID().Uint() != projectID {
		return note.ErrNoteNotFound
	}
	ok, err := s.canManage(ctx, n.ProjectID().Uint(), callerID, role)
	if err != nil {
		return err
	}
	if !ok {
		return ErrForbidden
	}
	return s.Notes.HardDelete(ctx, note.ID(noteID))
}

// ListDeleted возвращает мягко удалённые заметки проекта.
func (s *NoteService) ListDeleted(ctx context.Context, projectID, callerID uint, role user.Role) ([]*note.Note, error) {
	ok, err := s.canManage(ctx, projectID, callerID, role)
	if err != nil {
		return nil, err
	}
	if !ok {
		return nil, ErrForbidden
	}
	return s.Notes.ListDeletedByProject(ctx, project.ID(projectID))
}

// Move перемещает заметку в другую секцию/позицию.
func (s *NoteService) Move(ctx context.Context, noteID, callerID uint, role user.Role, sectionID *uint, position int) (*note.Note, error) {
	n, err := s.Notes.FindByID(ctx, note.ID(noteID))
	if err != nil {
		return nil, err
	}
	ok, err := s.canManage(ctx, n.ProjectID().Uint(), callerID, role)
	if err != nil {
		return nil, err
	}
	if !ok {
		return nil, ErrForbidden
	}
	var secID *project.SectionID
	if sectionID != nil {
		s2 := project.SectionID(*sectionID)
		secID = &s2
	}
	if err := s.ensureNoteSectionInProject(ctx, n.ProjectID(), secID); err != nil {
		return nil, err
	}
	n.MoveToSection(secID, position, s.Clock())
	if err := s.Notes.Save(ctx, n); err != nil {
		return nil, err
	}
	return n, nil
}

// ListLinks возвращает id задач, связанных с заметкой.
func (s *NoteService) ListLinks(ctx context.Context, noteID, callerID uint, role user.Role) ([]task.ID, error) {
	n, err := s.Notes.FindByID(ctx, note.ID(noteID))
	if err != nil {
		return nil, err
	}
	ok, err := s.canView(ctx, n.ProjectID().Uint(), callerID, role)
	if err != nil {
		return nil, err
	}
	if !ok {
		return nil, ErrForbidden
	}
	return s.Notes.ListLinkedTasks(ctx, note.ID(noteID))
}

// LinkTask создаёт связь заметки с задачей; задача и заметка должны быть в одном проекте.
func (s *NoteService) LinkTask(ctx context.Context, noteID, taskID, callerID uint, role user.Role) error {
	n, err := s.Notes.FindByID(ctx, note.ID(noteID))
	if err != nil {
		return err
	}
	ok, err := s.canManage(ctx, n.ProjectID().Uint(), callerID, role)
	if err != nil {
		return err
	}
	if !ok {
		return ErrForbidden
	}
	t, err := s.Tasks.FindByID(ctx, task.ID(taskID))
	if err != nil {
		return err
	}
	if t.ProjectID() != n.ProjectID() {
		return note.ErrTaskOtherProject
	}
	exists, err := s.Notes.HasLink(ctx, note.ID(noteID), task.ID(taskID))
	if err != nil {
		return err
	}
	if exists {
		return note.ErrLinkAlreadyExists
	}
	return s.Notes.LinkTask(ctx, note.ID(noteID), task.ID(taskID))
}

// UnlinkTask удаляет связь заметки с задачей.
func (s *NoteService) UnlinkTask(ctx context.Context, noteID, taskID, callerID uint, role user.Role) error {
	n, err := s.Notes.FindByID(ctx, note.ID(noteID))
	if err != nil {
		return err
	}
	ok, err := s.canManage(ctx, n.ProjectID().Uint(), callerID, role)
	if err != nil {
		return err
	}
	if !ok {
		return ErrForbidden
	}
	return s.Notes.UnlinkTask(ctx, note.ID(noteID), task.ID(taskID))
}

// ListLinkedNotes возвращает заметки, связанные с задачей.
func (s *NoteService) ListLinkedNotes(ctx context.Context, taskID, callerID uint, role user.Role) ([]*note.Note, error) {
	t, err := s.Tasks.FindByID(ctx, task.ID(taskID))
	if err != nil {
		return nil, err
	}
	ok, err := s.canView(ctx, t.ProjectID().Uint(), callerID, role)
	if err != nil {
		return nil, err
	}
	if !ok {
		return nil, ErrForbidden
	}
	return s.Notes.ListLinkedNotes(ctx, task.ID(taskID))
}
