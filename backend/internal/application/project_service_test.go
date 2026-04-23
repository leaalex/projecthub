package application_test

import (
	"context"
	"errors"
	"sort"
	"sync"
	"testing"
	"time"

	"task-manager/backend/internal/application"
	"task-manager/backend/internal/domain/project"
	"task-manager/backend/internal/domain/user"
)

// memProjects — in-memory project.Repository для unit-тестов ProjectService.
type memProjects struct {
	mu      sync.Mutex
	byID    map[uint]*project.Project
	softDel map[uint]struct{}
	nextPID  uint
	nextMID  uint
	nextSID  uint
}

func newMemProjects() *memProjects {
	return &memProjects{byID: map[uint]*project.Project{}, softDel: map[uint]struct{}{}}
}

func (m *memProjects) isActive(id uint) bool {
	_, del := m.softDel[id]
	return !del
}

func (m *memProjects) FindByID(ctx context.Context, id project.ID) (*project.Project, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	p, ok := m.byID[id.Uint()]
	if !ok || !m.isActive(id.Uint()) {
		return nil, project.ErrProjectNotFound
	}
	return p, nil
}

func (m *memProjects) ListAll(ctx context.Context) ([]*project.Project, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	out := make([]*project.Project, 0, len(m.byID))
	for id, p := range m.byID {
		if m.isActive(id) {
			out = append(out, p)
		}
	}
	return out, nil
}

func (m *memProjects) ListByOwner(ctx context.Context, owner user.ID) ([]*project.Project, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	var out []*project.Project
	for id, p := range m.byID {
		if p.OwnerID() == owner && m.isActive(id) {
			out = append(out, p)
		}
	}
	return out, nil
}

func (m *memProjects) ListMemberships(ctx context.Context, uid user.ID) ([]project.ID, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	var out []project.ID
	for id, p := range m.byID {
		if !m.isActive(id) {
			continue
		}
		for _, mem := range p.Members() {
			if mem.UserID() == uid {
				out = append(out, p.ID())
				break
			}
		}
	}
	return out, nil
}

func (m *memProjects) ListOwnedProjectIDs(ctx context.Context, uid user.ID) ([]uint, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	var out []uint
	for id, p := range m.byID {
		if !m.isActive(id) {
			continue
		}
		if p.OwnerID() == uid {
			out = append(out, p.ID().Uint())
		}
	}
	return out, nil
}

func (m *memProjects) Save(ctx context.Context, p *project.Project) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	if p.ID().Uint() == 0 {
		m.nextPID++
		p.AssignID(project.ID(m.nextPID))
	}
	for _, mem := range p.Members() {
		if mem.ID().Uint() == 0 {
			m.nextMID++
			mem.AssignID(project.MemberID(m.nextMID))
		}
	}
	for _, sec := range p.Sections() {
		if sec.ID().Uint() == 0 {
			m.nextSID++
			sec.AssignID(project.SectionID(m.nextSID))
		}
	}
	m.byID[p.ID().Uint()] = p
	return nil
}

func (m *memProjects) SoftDelete(ctx context.Context, id project.ID) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	if _, ok := m.byID[id.Uint()]; !ok {
		return project.ErrProjectNotFound
	}
	m.softDel[id.Uint()] = struct{}{}
	return nil
}

func (m *memProjects) Restore(ctx context.Context, id project.ID) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	if _, ok := m.byID[id.Uint()]; !ok {
		return project.ErrProjectNotFound
	}
	delete(m.softDel, id.Uint())
	return nil
}

func (m *memProjects) HardDelete(ctx context.Context, id project.ID) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	delete(m.softDel, id.Uint())
	delete(m.byID, id.Uint())
	return nil
}

func (m *memProjects) IsOwner(ctx context.Context, id project.ID, uid user.ID) (bool, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	p, ok := m.byID[id.Uint()]
	if !ok || !m.isActive(id.Uint()) {
		return false, nil
	}
	return p.OwnerID() == uid, nil
}

func (m *memProjects) IsOwnerIncludingDeleted(ctx context.Context, id project.ID, uid user.ID) (bool, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	p, ok := m.byID[id.Uint()]
	if !ok {
		return false, nil
	}
	return p.OwnerID() == uid, nil
}

func (m *memProjects) GetMemberRole(ctx context.Context, id project.ID, uid user.ID) (project.Role, bool, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	p, ok := m.byID[id.Uint()]
	if !ok || !m.isActive(id.Uint()) {
		return "", false, nil
	}
	for _, mem := range p.Members() {
		if mem.UserID() == uid {
			return mem.Role(), true, nil
		}
	}
	return "", false, nil
}

func (m *memProjects) AssigneeAllowed(ctx context.Context, id project.ID, uid user.ID) (bool, error) {
	ok, err := m.IsOwner(ctx, id, uid)
	if err != nil || ok {
		return ok, err
	}
	_, ok2, err := m.GetMemberRole(ctx, id, uid)
	return ok2, err
}

func seedUser(t *testing.T, mem *memUsers, role user.Role, email string) *user.User {
	t.Helper()
	hash, err := user.HashPassword("x")
	if err != nil {
		t.Fatal(err)
	}
	e, err := user.NewEmail(email)
	if err != nil {
		t.Fatal(err)
	}
	u, err := user.NewUser(e, hash, user.FullName{FirstName: email}, role)
	if err != nil {
		t.Fatal(err)
	}
	u.Touch(time.Now())
	if err := mem.Save(context.Background(), u); err != nil {
		t.Fatal(err)
	}
	loaded, err := mem.FindByID(context.Background(), u.ID())
	if err != nil {
		t.Fatal(err)
	}
	return loaded
}

func TestProjectService_Create_teamForbiddenForUser(t *testing.T) {
	memU := newMemUsers()
	repo := newMemProjects()
	svc := application.NewProjectService(repo, memU)
	seedUser(t, memU, user.RoleUser, "plain@x.test")

	_, _, err := svc.Create(context.Background(), 1, user.RoleUser, "P", "", "team")
	if !errors.Is(err, project.ErrTeamProjectNotAllowed) {
		t.Fatalf("expected ErrTeamProjectNotAllowed, got %v", err)
	}
}

func TestProjectService_Create_teamOkForCreator(t *testing.T) {
	memU := newMemUsers()
	repo := newMemProjects()
	svc := application.NewProjectService(repo, memU)
	seedUser(t, memU, user.RoleCreator, "cr@x.test")

	p, _, err := svc.Create(context.Background(), 1, user.RoleCreator, "Team", "", "team")
	if err != nil {
		t.Fatal(err)
	}
	if p.Kind() != project.KindTeam {
		t.Fatalf("kind %v", p.Kind())
	}
}

func TestProjectService_ListForCaller_includesMembership(t *testing.T) {
	memU := newMemUsers()
	repo := newMemProjects()
	svc := application.NewProjectService(repo, memU)
	seedUser(t, memU, user.RoleCreator, "owner@x.test")
	seedUser(t, memU, user.RoleUser, "member@x.test")

	p, err := project.NewProject(user.ID(1), user.RoleCreator, "Shared", "", project.KindTeam)
	if err != nil {
		t.Fatal(err)
	}
	p.Touch(time.Date(2020, 1, 1, 0, 0, 0, 0, time.UTC))
	if _, err := p.AddMember(user.ID(2), project.RoleExecutor, time.Date(2020, 1, 2, 0, 0, 0, 0, time.UTC)); err != nil {
		t.Fatal(err)
	}
	if err := repo.Save(context.Background(), p); err != nil {
		t.Fatal(err)
	}

	list, owners, err := svc.ListForCaller(context.Background(), 2, user.RoleUser)
	if err != nil {
		t.Fatal(err)
	}
	if len(list) != 1 {
		t.Fatalf("len(list)=%d", len(list))
	}
	if len(owners) != 1 || owners[0].ID().Uint() != 1 {
		t.Fatalf("owners: %+v", owners)
	}
}

func TestProjectService_AddMember_personalFails(t *testing.T) {
	memU := newMemUsers()
	repo := newMemProjects()
	svc := application.NewProjectService(repo, memU)
	seedUser(t, memU, user.RoleUser, "solo@x.test")

	p, _, err := svc.Create(context.Background(), 1, user.RoleUser, "Solo", "", "")
	if err != nil {
		t.Fatal(err)
	}
	seedUser(t, memU, user.RoleUser, "other@x.test")

	_, _, err = svc.AddMember(context.Background(), p.ID().Uint(), 2, "viewer")
	if !errors.Is(err, project.ErrPersonalNoMembers) {
		t.Fatalf("got %v", err)
	}
}

func TestProjectService_AddMember_duplicate(t *testing.T) {
	memU := newMemUsers()
	repo := newMemProjects()
	svc := application.NewProjectService(repo, memU)
	seedUser(t, memU, user.RoleCreator, "o@x.test")
	seedUser(t, memU, user.RoleUser, "m@x.test")

	p, _, err := svc.Create(context.Background(), 1, user.RoleCreator, "T", "", "team")
	if err != nil {
		t.Fatal(err)
	}
	if _, _, err := svc.AddMember(context.Background(), p.ID().Uint(), 2, "viewer"); err != nil {
		t.Fatal(err)
	}
	_, _, err = svc.AddMember(context.Background(), p.ID().Uint(), 2, "executor")
	if !errors.Is(err, project.ErrAlreadyMember) {
		t.Fatalf("got %v", err)
	}
}

func TestProjectService_TransferOwnership_oldOwnerBecomesManager(t *testing.T) {
	memU := newMemUsers()
	repo := newMemProjects()
	svc := application.NewProjectService(repo, memU)
	seedUser(t, memU, user.RoleAdmin, "admin@x.test")
	seedUser(t, memU, user.RoleCreator, "owner@x.test")
	seedUser(t, memU, user.RoleUser, "next@x.test")

	p, err := project.NewProject(user.ID(2), user.RoleCreator, "Co", "", project.KindTeam)
	if err != nil {
		t.Fatal(err)
	}
	now := time.Now()
	p.Touch(now)
	if _, err := p.AddMember(user.ID(3), project.RoleExecutor, now); err != nil {
		t.Fatal(err)
	}
	if err := repo.Save(context.Background(), p); err != nil {
		t.Fatal(err)
	}

	if err := svc.TransferOwnership(context.Background(), p.ID().Uint(), 3, 1, user.RoleAdmin); err != nil {
		t.Fatal(err)
	}
	p2, err := repo.FindByID(context.Background(), p.ID())
	if err != nil {
		t.Fatal(err)
	}
	if p2.OwnerID().Uint() != 3 {
		t.Fatalf("owner=%d", p2.OwnerID())
	}
	var foundOld bool
	for _, m := range p2.Members() {
		if m.UserID().Uint() == 2 {
			foundOld = true
			if m.Role() != project.RoleManager {
				t.Fatalf("old owner role %v", m.Role())
			}
		}
		if m.UserID().Uint() == 3 {
			t.Fatal("new owner should not stay in members slice")
		}
	}
	if !foundOld {
		t.Fatal("old owner not in members as manager")
	}
}

func TestProjectService_ReorderSections(t *testing.T) {
	memU := newMemUsers()
	repo := newMemProjects()
	svc := application.NewProjectService(repo, memU)
	seedUser(t, memU, user.RoleCreator, "c@x.test")

	p, _, err := svc.Create(context.Background(), 1, user.RoleCreator, "R", "", "team")
	if err != nil {
		t.Fatal(err)
	}
	s1, err := svc.AddSection(context.Background(), p.ID().Uint(), "A", "")
	if err != nil {
		t.Fatal(err)
	}
	s2, err := svc.AddSection(context.Background(), p.ID().Uint(), "B", "")
	if err != nil {
		t.Fatal(err)
	}
	if err := svc.ReorderSections(context.Background(), p.ID().Uint(), []uint{s2.ID().Uint(), s1.ID().Uint()}); err != nil {
		t.Fatal(err)
	}
	p2, err := repo.FindByID(context.Background(), p.ID())
	if err != nil {
		t.Fatal(err)
	}
	secs := p2.Sections()
	if len(secs) != 2 {
		t.Fatalf("sections %d", len(secs))
	}
	sort.Slice(secs, func(i, j int) bool { return secs[i].Position() < secs[j].Position() })
	if secs[0].ID() != s2.ID() || secs[0].Position() != 1 {
		t.Fatalf("pos1 section %+v", secs[0])
	}
	if secs[1].ID() != s1.ID() || secs[1].Position() != 2 {
		t.Fatalf("pos2 section %+v", secs[1])
	}
}

func TestProjectService_SectionDisplayMode(t *testing.T) {
	memU := newMemUsers()
	repo := newMemProjects()
	svc := application.NewProjectService(repo, memU)
	seedUser(t, memU, user.RoleCreator, "c@x.test")

	p, _, err := svc.Create(context.Background(), 1, user.RoleCreator, "S", "", "team")
	if err != nil {
		t.Fatal(err)
	}
	sec, err := svc.AddSection(context.Background(), p.ID().Uint(), "Col", "progress")
	if err != nil {
		t.Fatal(err)
	}
	if sec.DisplayMode() != project.SectionDisplayProgress {
		t.Fatalf("mode %v", sec.DisplayMode())
	}
	plain := "plain"
	up, err := svc.UpdateSection(context.Background(), p.ID().Uint(), sec.ID().Uint(), "Col2", &plain)
	if err != nil {
		t.Fatal(err)
	}
	if up.Name() != "Col2" || up.DisplayMode() != project.SectionDisplayPlain {
		t.Fatalf("got %+v / %v", up.Name(), up.DisplayMode())
	}
	p2, err := repo.FindByID(context.Background(), p.ID())
	if err != nil {
		t.Fatal(err)
	}
	var found *project.Section
	for _, s := range p2.Sections() {
		if s.ID() == sec.ID() {
			found = s
			break
		}
	}
	if found == nil {
		t.Fatal("section not found after repo load")
	}
	if found.DisplayMode() != project.SectionDisplayPlain {
		t.Fatalf("after repo load display mode: got %v want plain", found.DisplayMode())
	}
	_, err = svc.AddSection(context.Background(), p.ID().Uint(), "Bad", "invalid")
	if err != project.ErrInvalidSectionDisplayMode {
		t.Fatalf("got %v", err)
	}
}
