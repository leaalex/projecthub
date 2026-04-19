package application_test

import (
	"context"
	"testing"
	"time"

	"task-manager/backend/internal/application"
	"task-manager/backend/internal/domain/note"
	"task-manager/backend/internal/domain/project"
	"task-manager/backend/internal/domain/task"
	"task-manager/backend/internal/domain/user"
)

// memNotes — in-memory note.Repository for tests.
type memNotes struct {
	byID    map[uint]*note.Note
	deleted map[uint]*note.Note
	links   map[uint][]uint // noteID → []taskID
	nextID  uint
}

func newMemNotes() *memNotes {
	return &memNotes{
		byID:    map[uint]*note.Note{},
		deleted: map[uint]*note.Note{},
		links:   map[uint][]uint{},
	}
}

func (m *memNotes) FindByID(_ context.Context, id note.ID) (*note.Note, error) {
	n, ok := m.byID[id.Uint()]
	if !ok {
		return nil, note.ErrNoteNotFound
	}
	return n, nil
}

func (m *memNotes) FindByIDUnscoped(_ context.Context, id note.ID) (*note.Note, error) {
	if n, ok := m.byID[id.Uint()]; ok {
		return n, nil
	}
	if n, ok := m.deleted[id.Uint()]; ok {
		return n, nil
	}
	return nil, note.ErrNoteNotFound
}

func (m *memNotes) Save(_ context.Context, n *note.Note) error {
	if n.ID().Uint() == 0 {
		m.nextID++
		n.AssignID(note.ID(m.nextID))
	}
	id := n.ID().Uint()
	delete(m.deleted, id)
	m.byID[id] = n
	return nil
}

func (m *memNotes) SoftDelete(_ context.Context, id note.ID) error {
	n, ok := m.byID[id.Uint()]
	if !ok {
		return note.ErrNoteNotFound
	}
	delete(m.byID, id.Uint())
	m.deleted[id.Uint()] = n
	return nil
}

func (m *memNotes) Restore(_ context.Context, id note.ID) error {
	n, ok := m.deleted[id.Uint()]
	if !ok {
		return note.ErrNoteNotFound
	}
	delete(m.deleted, id.Uint())
	m.byID[id.Uint()] = n
	return nil
}

func (m *memNotes) HardDelete(_ context.Context, id note.ID) error {
	delete(m.byID, id.Uint())
	delete(m.deleted, id.Uint())
	delete(m.links, id.Uint())
	return nil
}

func (m *memNotes) DeleteByProject(_ context.Context, projectID project.ID) error {
	for id, n := range m.byID {
		if n.ProjectID() == projectID {
			delete(m.byID, id)
			delete(m.links, id)
		}
	}
	for id, n := range m.deleted {
		if n.ProjectID() == projectID {
			delete(m.deleted, id)
			delete(m.links, id)
		}
	}
	return nil
}

func (m *memNotes) ListVisible(_ context.Context, filter note.ListFilter) ([]*note.Note, error) {
	if !filter.CallerIsSystem && len(filter.VisibleProjectIDs) == 0 {
		return nil, nil
	}
	var out []*note.Note
	for _, n := range m.byID {
		pid := n.ProjectID().Uint()
		if !filter.CallerIsSystem {
			ok := false
			for _, v := range filter.VisibleProjectIDs {
				if v == pid {
					ok = true
					break
				}
			}
			if !ok {
				continue
			}
		}
		if filter.ProjectID != nil && n.ProjectID() != *filter.ProjectID {
			continue
		}
		out = append(out, n)
	}
	return out, nil
}

func (m *memNotes) ListByProject(_ context.Context, projectID project.ID) ([]*note.Note, error) {
	var out []*note.Note
	for _, n := range m.byID {
		if n.ProjectID() == projectID {
			out = append(out, n)
		}
	}
	return out, nil
}

func (m *memNotes) ListDeletedByProject(_ context.Context, projectID project.ID) ([]*note.Note, error) {
	var out []*note.Note
	for _, n := range m.deleted {
		if n.ProjectID() == projectID {
			out = append(out, n)
		}
	}
	return out, nil
}

func (m *memNotes) NextPosition(_ context.Context, projectID project.ID, sectionID *project.SectionID) (int, error) {
	return 1, nil
}

func (m *memNotes) ListLinkedTasks(_ context.Context, noteID note.ID) ([]task.ID, error) {
	ids := m.links[noteID.Uint()]
	out := make([]task.ID, len(ids))
	for i, v := range ids {
		out[i] = task.ID(v)
	}
	return out, nil
}

func (m *memNotes) ListLinkedNotes(_ context.Context, taskID task.ID) ([]*note.Note, error) {
	var out []*note.Note
	for nid, taskIDs := range m.links {
		for _, tid := range taskIDs {
			if tid == taskID.Uint() {
				// Как в GORM: в выдачу попадают только «живые» заметки.
				if n, ok := m.byID[nid]; ok {
					out = append(out, n)
				}
				break
			}
		}
	}
	return out, nil
}

func (m *memNotes) LinkTask(_ context.Context, noteID note.ID, taskID task.ID) error {
	m.links[noteID.Uint()] = append(m.links[noteID.Uint()], taskID.Uint())
	return nil
}

func (m *memNotes) UnlinkTask(_ context.Context, noteID note.ID, taskID task.ID) error {
	ids := m.links[noteID.Uint()]
	out := ids[:0]
	for _, v := range ids {
		if v != taskID.Uint() {
			out = append(out, v)
		}
	}
	m.links[noteID.Uint()] = out
	return nil
}

func (m *memNotes) HasLink(_ context.Context, noteID note.ID, taskID task.ID) (bool, error) {
	for _, v := range m.links[noteID.Uint()] {
		if v == taskID.Uint() {
			return true, nil
		}
	}
	return false, nil
}

// -- Tests --

func TestNoteService_Create_forbiddenViewer(t *testing.T) {
	memP := newMemProjects()
	memT := newMemTasks()
	memN := newMemNotes()
	svc := application.NewNoteService(memN, memT, memP)

	p, _ := project.NewProject(user.ID(1), user.RoleCreator, "P", "", project.KindTeam)
	p.Touch(time.Now())
	if _, err := p.AddMember(user.ID(2), project.RoleExecutor, time.Now()); err != nil {
		t.Fatal(err)
	}
	_ = memP.Save(context.Background(), p)

	// Executor cannot create notes (not manager).
	_, err := svc.Create(context.Background(), 2, user.RoleUser, application.NoteCreate{
		ProjectID: p.ID().Uint(),
		Title:     "Note",
	})
	if err == nil {
		t.Fatal("expected error for executor creating note")
	}
}

func TestNoteService_Create_ownerSucceeds(t *testing.T) {
	memP := newMemProjects()
	memT := newMemTasks()
	memN := newMemNotes()
	svc := application.NewNoteService(memN, memT, memP)

	p, _ := project.NewProject(user.ID(1), user.RoleCreator, "P", "", project.KindTeam)
	p.Touch(time.Now())
	_ = memP.Save(context.Background(), p)

	n, err := svc.Create(context.Background(), 1, user.RoleCreator, application.NoteCreate{
		ProjectID: p.ID().Uint(),
		Title:     "My Note",
		Body:      "# Hello",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if n.Title() != "My Note" {
		t.Errorf("unexpected title: %q", n.Title())
	}
}

func TestNoteService_LinkTask_crossProjectRejected(t *testing.T) {
	memP := newMemProjects()
	memT := newMemTasks()
	memN := newMemNotes()
	svc := application.NewNoteService(memN, memT, memP)

	p1, _ := project.NewProject(user.ID(1), user.RoleCreator, "P1", "", project.KindTeam)
	p1.Touch(time.Now())
	_ = memP.Save(context.Background(), p1)

	p2, _ := project.NewProject(user.ID(1), user.RoleCreator, "P2", "", project.KindTeam)
	p2.Touch(time.Now())
	_ = memP.Save(context.Background(), p2)

	// Create note in p1.
	n, _ := svc.Create(context.Background(), 1, user.RoleCreator, application.NoteCreate{
		ProjectID: p1.ID().Uint(),
		Title:     "Note in P1",
	})

	// Create task in p2.
	now := time.Now()
	tk, _ := task.NewTask(p2.ID(), nil, "T", "", task.StatusTodo, task.PriorityMedium, 0, nil, now)
	_ = memT.Save(context.Background(), tk)

	// Linking should fail.
	err := svc.LinkTask(context.Background(), n.ID().Uint(), tk.ID().Uint(), 1, user.RoleCreator)
	if err != note.ErrTaskOtherProject {
		t.Fatalf("expected ErrTaskOtherProject, got %v", err)
	}
}

func TestNoteService_LinkTask_sameProject(t *testing.T) {
	memP := newMemProjects()
	memT := newMemTasks()
	memN := newMemNotes()
	svc := application.NewNoteService(memN, memT, memP)

	p, _ := project.NewProject(user.ID(1), user.RoleCreator, "P", "", project.KindTeam)
	p.Touch(time.Now())
	_ = memP.Save(context.Background(), p)

	n, _ := svc.Create(context.Background(), 1, user.RoleCreator, application.NoteCreate{
		ProjectID: p.ID().Uint(),
		Title:     "Note",
	})

	now := time.Now()
	tk, _ := task.NewTask(p.ID(), nil, "T", "", task.StatusTodo, task.PriorityMedium, 0, nil, now)
	_ = memT.Save(context.Background(), tk)

	if err := svc.LinkTask(context.Background(), n.ID().Uint(), tk.ID().Uint(), 1, user.RoleCreator); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Duplicate link rejected.
	if err := svc.LinkTask(context.Background(), n.ID().Uint(), tk.ID().Uint(), 1, user.RoleCreator); err != note.ErrLinkAlreadyExists {
		t.Fatalf("expected ErrLinkAlreadyExists, got %v", err)
	}
}

func TestNoteService_ListVisible_ScopesByMembership(t *testing.T) {
	memP := newMemProjects()
	memT := newMemTasks()
	memN := newMemNotes()
	svc := application.NewNoteService(memN, memT, memP)

	pMine, _ := project.NewProject(user.ID(1), user.RoleCreator, "Mine", "", project.KindTeam)
	pMine.Touch(time.Now())
	_ = memP.Save(context.Background(), pMine)

	pOther, _ := project.NewProject(user.ID(99), user.RoleCreator, "Other", "", project.KindTeam)
	pOther.Touch(time.Now())
	_ = memP.Save(context.Background(), pOther)

	n1, err := svc.Create(context.Background(), 1, user.RoleCreator, application.NoteCreate{
		ProjectID: pMine.ID().Uint(),
		Title:     "In mine",
	})
	if err != nil {
		t.Fatal(err)
	}

	// User 99 creates note in their project; user 1 must not see it without membership.
	_, err = svc.Create(context.Background(), 99, user.RoleCreator, application.NoteCreate{
		ProjectID: pOther.ID().Uint(),
		Title:     "Secret",
	})
	if err != nil {
		t.Fatal(err)
	}

	all, err := svc.ListVisible(context.Background(), 1, user.RoleCreator, nil)
	if err != nil {
		t.Fatal(err)
	}
	if len(all) != 1 || all[0].ID() != n1.ID() {
		t.Fatalf("expected 1 note for user 1, got %d", len(all))
	}

	pidOther := pOther.ID().Uint()
	filtered, err := svc.ListVisible(context.Background(), 1, user.RoleCreator, &pidOther)
	if err != nil {
		t.Fatal(err)
	}
	if len(filtered) != 0 {
		t.Fatalf("expected 0 notes when filtering to foreign project, got %d", len(filtered))
	}

	// Add user 1 as member of pOther → sees both when unfiltered.
	if _, err := pOther.AddMember(user.ID(1), project.RoleViewer, time.Now()); err != nil {
		t.Fatal(err)
	}
	_ = memP.Save(context.Background(), pOther)

	all2, err := svc.ListVisible(context.Background(), 1, user.RoleCreator, nil)
	if err != nil {
		t.Fatal(err)
	}
	if len(all2) != 2 {
		t.Fatalf("expected 2 notes after membership, got %d", len(all2))
	}

	filtered2, err := svc.ListVisible(context.Background(), 1, user.RoleCreator, &pidOther)
	if err != nil {
		t.Fatal(err)
	}
	if len(filtered2) != 1 {
		t.Fatalf("expected 1 note in other project after membership, got %d", len(filtered2))
	}
}

func TestNoteService_SoftDeleteRestore_Cycle(t *testing.T) {
	memP := newMemProjects()
	memT := newMemTasks()
	memN := newMemNotes()
	svc := application.NewNoteService(memN, memT, memP)

	p, _ := project.NewProject(user.ID(1), user.RoleCreator, "P", "", project.KindTeam)
	p.Touch(time.Now())
	_ = memP.Save(context.Background(), p)

	n, err := svc.Create(context.Background(), 1, user.RoleCreator, application.NoteCreate{
		ProjectID: p.ID().Uint(),
		Title:     "Trash me",
	})
	if err != nil {
		t.Fatal(err)
	}
	if err := svc.SoftDelete(context.Background(), n.ID().Uint(), 1, user.RoleCreator); err != nil {
		t.Fatal(err)
	}
	deleted, err := svc.ListDeleted(context.Background(), p.ID().Uint(), 1, user.RoleCreator)
	if err != nil {
		t.Fatal(err)
	}
	if len(deleted) != 1 {
		t.Fatalf("expected 1 deleted note, got %d", len(deleted))
	}
	if err := svc.Restore(context.Background(), n.ID().Uint(), 1, user.RoleCreator); err != nil {
		t.Fatal(err)
	}
	deleted2, err := svc.ListDeleted(context.Background(), p.ID().Uint(), 1, user.RoleCreator)
	if err != nil {
		t.Fatal(err)
	}
	if len(deleted2) != 0 {
		t.Fatalf("expected 0 deleted after restore, got %d", len(deleted2))
	}
	live, err := svc.List(context.Background(), p.ID().Uint(), 1, user.RoleCreator)
	if err != nil {
		t.Fatal(err)
	}
	if len(live) != 1 {
		t.Fatalf("expected 1 live note after restore, got %d", len(live))
	}
}
