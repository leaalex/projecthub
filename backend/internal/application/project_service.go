package application

import (
	"context"
	"errors"
	"sort"
	"strings"
	"time"

	"task-manager/backend/internal/domain/project"
	"task-manager/backend/internal/domain/user"
)

// ProjectService — сценарии проекта, участников и секций.
type ProjectService struct {
	Projects project.Repository
	Users    user.Repository
	Clock    func() time.Time
}

func NewProjectService(projects project.Repository, users user.Repository) *ProjectService {
	return &ProjectService{
		Projects: projects,
		Users:    users,
		Clock:    time.Now,
	}
}

func (s *ProjectService) now() time.Time {
	if s.Clock != nil {
		return s.Clock()
	}
	return time.Now()
}

// MemberWithUser — участник с данными пользователя для JSON.
type MemberWithUser struct {
	Member *project.Member
	User   *user.User
}

// Create создаёт проект и возвращает агрегат и владельца.
func (s *ProjectService) Create(ctx context.Context, ownerID uint, ownerRole user.Role, name, description, kindStr string) (*project.Project, *user.User, error) {
	kind, err := parseKindForCreate(ownerRole, kindStr)
	if err != nil {
		return nil, nil, ErrInvalidInput
	}
	p, err := project.NewProject(user.ID(ownerID), ownerRole, name, description, kind)
	if err != nil {
		return nil, nil, err
	}
	p.Touch(s.now())
	if err := s.Projects.Save(ctx, p); err != nil {
		return nil, nil, err
	}
	owner, err := s.Users.FindByID(ctx, user.ID(ownerID))
	if err != nil {
		return nil, nil, err
	}
	return p, owner, nil
}

func parseKindForCreate(ownerRole user.Role, kindStr string) (project.Kind, error) {
	kindStr = strings.TrimSpace(strings.ToLower(kindStr))
	if kindStr == "" {
		if ownerRole == user.RoleUser {
			return project.KindPersonal, nil
		}
		return project.KindTeam, nil
	}
	return project.ParseKind(kindStr)
}

// ListForCaller возвращает проекты и владельцев (для списка /projects).
func (s *ProjectService) ListForCaller(ctx context.Context, callerID uint, role user.Role) ([]*project.Project, []*user.User, error) {
	if user.IsSystemRole(role) {
		list, err := s.Projects.ListAll(ctx)
		if err != nil {
			return nil, nil, err
		}
		owners, err := s.loadOwnersForProjects(ctx, list)
		return list, owners, err
	}

	owned, err := s.Projects.ListByOwner(ctx, user.ID(callerID))
	if err != nil {
		return nil, nil, err
	}
	byID := make(map[uint]*project.Project, len(owned))
	for _, p := range owned {
		byID[p.ID().Uint()] = p
	}

	memberPIDs, err := s.Projects.ListMemberships(ctx, user.ID(callerID))
	if err != nil {
		return nil, nil, err
	}

	if role == user.RoleUser && len(memberPIDs) == 0 {
		owners, err := s.loadOwnersForProjects(ctx, owned)
		return owned, owners, err
	}

	if len(memberPIDs) == 0 && role != user.RoleUser {
		owners, err := s.loadOwnersForProjects(ctx, owned)
		return owned, owners, err
	}

	for _, mid := range memberPIDs {
		id := mid.Uint()
		if _, ok := byID[id]; ok {
			continue
		}
		p, err := s.Projects.FindByID(ctx, mid)
		if err != nil {
			if errors.Is(err, project.ErrProjectNotFound) {
				continue
			}
			return nil, nil, err
		}
		byID[id] = p
	}

	out := make([]*project.Project, 0, len(byID))
	for _, p := range byID {
		out = append(out, p)
	}
	sort.Slice(out, func(i, j int) bool {
		return out[i].UpdatedAt().After(out[j].UpdatedAt())
	})
	owners, err := s.loadOwnersForProjects(ctx, out)
	return out, owners, err
}

func (s *ProjectService) loadOwnersForProjects(ctx context.Context, list []*project.Project) ([]*user.User, error) {
	owners := make([]*user.User, len(list))
	for i, p := range list {
		u, err := s.Users.FindByID(ctx, p.OwnerID())
		if err != nil {
			return nil, err
		}
		owners[i] = u
	}
	return owners, nil
}

// Get возвращает проект и владельца при доступе вызывающего.
func (s *ProjectService) Get(ctx context.Context, id, callerID uint, role user.Role) (*project.Project, *user.User, error) {
	p, err := s.Projects.FindByID(ctx, project.ID(id))
	if err != nil {
		return nil, nil, err
	}
	if !s.CanAccessProject(ctx, id, callerID, role) {
		return nil, nil, project.ErrForbidden
	}
	owner, err := s.Users.FindByID(ctx, p.OwnerID())
	if err != nil {
		return nil, nil, err
	}
	return p, owner, nil
}

// Update переименовывает проект (владелец или системная роль).
func (s *ProjectService) Update(ctx context.Context, id, callerID uint, role user.Role, name, description string) (*project.Project, *user.User, error) {
	p, err := s.Projects.FindByID(ctx, project.ID(id))
	if err != nil {
		return nil, nil, err
	}
	if !s.canModifyProjectMetadata(p, callerID, role) {
		return nil, nil, project.ErrForbidden
	}
	if err := p.Rename(name, s.now()); err != nil {
		return nil, nil, err
	}
	p.UpdateDescription(description, s.now())
	if err := s.Projects.Save(ctx, p); err != nil {
		return nil, nil, err
	}
	owner, err := s.Users.FindByID(ctx, p.OwnerID())
	if err != nil {
		return nil, nil, err
	}
	return p, owner, nil
}

// Delete удаляет проект (владелец или системная роль).
func (s *ProjectService) Delete(ctx context.Context, id, callerID uint, role user.Role) error {
	p, err := s.Projects.FindByID(ctx, project.ID(id))
	if err != nil {
		return err
	}
	if !s.canModifyProjectMetadata(p, callerID, role) {
		return project.ErrForbidden
	}
	return s.Projects.SoftDelete(ctx, project.ID(id))
}

func (s *ProjectService) canModifyProjectMetadata(p *project.Project, callerID uint, role user.Role) bool {
	if user.IsSystemRole(role) {
		return true
	}
	return p.OwnerID().Uint() == callerID
}

// CanAccessProject — admin/staff, владелец или участник.
func (s *ProjectService) CanAccessProject(ctx context.Context, projectID, callerID uint, globalRole user.Role) bool {
	if user.IsSystemRole(globalRole) {
		return true
	}
	p, err := s.Projects.FindByID(ctx, project.ID(projectID))
	if err != nil {
		return false
	}
	if p.OwnerID().Uint() == callerID {
		return true
	}
	ok, err := s.Projects.AssigneeAllowed(ctx, project.ID(projectID), user.ID(callerID))
	return err == nil && ok
}

// CanManageMembers — admin/staff, владелец или менеджер-участник.
func (s *ProjectService) CanManageMembers(ctx context.Context, projectID, callerID uint, globalRole user.Role) bool {
	if user.IsSystemRole(globalRole) {
		return true
	}
	p, err := s.Projects.FindByID(ctx, project.ID(projectID))
	if err != nil {
		return false
	}
	if p.OwnerID().Uint() == callerID {
		return true
	}
	r, ok, err := s.Projects.GetMemberRole(ctx, project.ID(projectID), user.ID(callerID))
	return err == nil && ok && r == project.RoleManager
}

// CanManageProjectTasks — как в TaskService (секции, задачи).
func (s *ProjectService) CanManageProjectTasks(ctx context.Context, projectID, callerID uint, role user.Role) (bool, error) {
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

// CallerProjectRoleString — метка роли вызывающего в контексте проекта.
func (s *ProjectService) CallerProjectRoleString(ctx context.Context, projectID, callerID uint, globalRole user.Role) string {
	switch globalRole {
	case user.RoleAdmin:
		return "admin"
	case user.RoleStaff:
		return "staff"
	}
	p, err := s.Projects.FindByID(ctx, project.ID(projectID))
	if err != nil {
		return ""
	}
	if p.OwnerID().Uint() == callerID {
		return "owner"
	}
	if r, ok, _ := s.Projects.GetMemberRole(ctx, project.ID(projectID), user.ID(callerID)); ok {
		return r.String()
	}
	return ""
}

// ProjectKind возвращает kind проекта.
func (s *ProjectService) ProjectKind(ctx context.Context, projectID uint) (project.Kind, error) {
	p, err := s.Projects.FindByID(ctx, project.ID(projectID))
	if err != nil {
		return "", err
	}
	return p.Kind(), nil
}

// ListMembers возвращает участников с пользователями.
func (s *ProjectService) ListMembers(ctx context.Context, projectID uint) ([]MemberWithUser, error) {
	p, err := s.Projects.FindByID(ctx, project.ID(projectID))
	if err != nil {
		return nil, err
	}
	out := make([]MemberWithUser, 0, len(p.Members()))
	for _, m := range p.Members() {
		u, err := s.Users.FindByID(ctx, m.UserID())
		if err != nil {
			return nil, err
		}
		out = append(out, MemberWithUser{Member: m, User: u})
	}
	return out, nil
}

// AddMember добавляет участника.
func (s *ProjectService) AddMember(ctx context.Context, projectID, targetUserID uint, roleStr string) (*project.Member, *user.User, error) {
	r, err := project.ParseRole(roleStr)
	if err != nil {
		return nil, nil, ErrInvalidInput
	}
	p, err := s.Projects.FindByID(ctx, project.ID(projectID))
	if err != nil {
		return nil, nil, err
	}
	m, err := p.AddMember(user.ID(targetUserID), r, s.now())
	if err != nil {
		return nil, nil, err
	}
	if err := s.Projects.Save(ctx, p); err != nil {
		return nil, nil, err
	}
	u, err := s.Users.FindByID(ctx, user.ID(targetUserID))
	if err != nil {
		return nil, nil, err
	}
	return m, u, nil
}

// UpdateMemberRole обновляет роль участника.
func (s *ProjectService) UpdateMemberRole(ctx context.Context, projectID, targetUserID uint, roleStr string) (*project.Member, *user.User, error) {
	r, err := project.ParseRole(roleStr)
	if err != nil {
		return nil, nil, ErrInvalidInput
	}
	p, err := s.Projects.FindByID(ctx, project.ID(projectID))
	if err != nil {
		return nil, nil, err
	}
	if err := p.UpdateMemberRole(user.ID(targetUserID), r, s.now()); err != nil {
		return nil, nil, err
	}
	if err := s.Projects.Save(ctx, p); err != nil {
		return nil, nil, err
	}
	var target *project.Member
	for _, m := range p.Members() {
		if m.UserID().Uint() == targetUserID {
			target = m
			break
		}
	}
	if target == nil {
		return nil, nil, project.ErrNotMember
	}
	u, err := s.Users.FindByID(ctx, user.ID(targetUserID))
	if err != nil {
		return nil, nil, err
	}
	return target, u, nil
}

// TransferOwnership передаёт владение (только admin/staff).
func (s *ProjectService) TransferOwnership(ctx context.Context, projectID, newOwnerID, callerID uint, globalRole user.Role) error {
	if !user.IsSystemRole(globalRole) {
		return ErrForbidden
	}
	if _, err := s.Users.FindByID(ctx, user.ID(newOwnerID)); err != nil {
		if errors.Is(err, user.ErrUserNotFound) {
			return ErrTargetUserNotFound
		}
		return err
	}
	p, err := s.Projects.FindByID(ctx, project.ID(projectID))
	if err != nil {
		return err
	}
	if err := p.TransferOwnership(user.ID(newOwnerID), s.now()); err != nil {
		return err
	}
	return s.Projects.Save(ctx, p)
}

// ResolveUserIDByEmail ищет пользователя по email.
func (s *ProjectService) ResolveUserIDByEmail(ctx context.Context, email string) (uint, error) {
	e, err := user.NewEmail(email)
	if err != nil {
		return 0, ErrInvalidInput
	}
	u, err := s.Users.FindByEmail(ctx, e)
	if err != nil {
		if errors.Is(err, user.ErrUserNotFound) {
			return 0, ErrTargetUserNotFound
		}
		return 0, err
	}
	return u.ID().Uint(), nil
}

// ListSections возвращает секции проекта.
func (s *ProjectService) ListSections(ctx context.Context, projectID uint) ([]*project.Section, error) {
	p, err := s.Projects.FindByID(ctx, project.ID(projectID))
	if err != nil {
		return nil, err
	}
	out := make([]*project.Section, 0, len(p.Sections()))
	for _, sec := range p.Sections() {
		out = append(out, sec)
	}
	return out, nil
}

// AddSection добавляет секцию.
func (s *ProjectService) AddSection(ctx context.Context, projectID uint, name string) (*project.Section, error) {
	p, err := s.Projects.FindByID(ctx, project.ID(projectID))
	if err != nil {
		return nil, err
	}
	sec, err := p.AddSection(name, s.now())
	if err != nil {
		return nil, err
	}
	if err := s.Projects.Save(ctx, p); err != nil {
		return nil, err
	}
	return sec, nil
}

// RenameSection переименовывает секцию.
func (s *ProjectService) RenameSection(ctx context.Context, projectID, sectionID uint, name string) (*project.Section, error) {
	p, err := s.Projects.FindByID(ctx, project.ID(projectID))
	if err != nil {
		return nil, err
	}
	sid := project.SectionID(sectionID)
	if err := p.RenameSection(sid, name, s.now()); err != nil {
		return nil, err
	}
	if err := s.Projects.Save(ctx, p); err != nil {
		return nil, err
	}
	p2, err := s.Projects.FindByID(ctx, project.ID(projectID))
	if err != nil {
		return nil, err
	}
	return p2.SectionByID(sid), nil
}

// DeleteSection удаляет секцию.
func (s *ProjectService) DeleteSection(ctx context.Context, projectID, sectionID uint) error {
	p, err := s.Projects.FindByID(ctx, project.ID(projectID))
	if err != nil {
		return err
	}
	if err := p.RemoveSection(project.SectionID(sectionID), s.now()); err != nil {
		return err
	}
	return s.Projects.Save(ctx, p)
}

// ReorderSections задаёт порядок секций.
func (s *ProjectService) ReorderSections(ctx context.Context, projectID uint, sectionIDs []uint) error {
	p, err := s.Projects.FindByID(ctx, project.ID(projectID))
	if err != nil {
		return err
	}
	order := make([]project.SectionID, len(sectionIDs))
	for i, id := range sectionIDs {
		order[i] = project.SectionID(id)
	}
	if err := p.ReorderSections(order, s.now()); err != nil {
		return err
	}
	return s.Projects.Save(ctx, p)
}
