package application

import (
	"context"
	"time"

	"task-manager/backend/internal/domain/project"
	"task-manager/backend/internal/domain/task"
	"task-manager/backend/internal/domain/user"
	"task-manager/backend/internal/infrastructure/persistence/projectstore"
	"task-manager/backend/internal/infrastructure/persistence/taskstore"

	"gorm.io/gorm"
)

// SubtaskBrief — JSON подзадачи для RemoveResult.tasks (совместимость с API).
type SubtaskBrief struct {
	ID        uint      `json:"id"`
	TaskID    uint      `json:"task_id"`
	Title     string    `json:"title"`
	Done      bool      `json:"done"`
	Position  int       `json:"position"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// TaskBrief — JSON задачи для RemoveResult.tasks (ручной режим).
type TaskBrief struct {
	ID          uint           `json:"id"`
	Title       string         `json:"title"`
	Description string         `json:"description"`
	Status      string         `json:"status"`
	Priority    string         `json:"priority"`
	ProjectID   uint           `json:"project_id"`
	SectionID   *uint          `json:"section_id"`
	Position    int            `json:"position"`
	AssigneeID  *uint          `json:"assignee_id"`
	DueDate     *time.Time     `json:"due_date"`
	Subtasks    []SubtaskBrief `json:"subtasks"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
}

func taskToBrief(t *task.Task) TaskBrief {
	var secID *uint
	if sid := t.SectionID(); sid != nil {
		v := sid.Uint()
		secID = &v
	}
	var aid *uint
	if a := t.AssigneeID(); a != nil {
		v := a.Uint()
		aid = &v
	}
	subs := make([]SubtaskBrief, 0, len(t.Subtasks()))
	for _, st := range t.Subtasks() {
		if st == nil {
			continue
		}
		subs = append(subs, SubtaskBrief{
			ID:        st.ID().Uint(),
			TaskID:    t.ID().Uint(),
			Title:     st.Title(),
			Done:      st.Done(),
			Position:  st.Position(),
			CreatedAt: st.CreatedAt(),
			UpdatedAt: st.UpdatedAt(),
		})
	}
	return TaskBrief{
		ID:          t.ID().Uint(),
		Title:       t.Title(),
		Description: t.Description(),
		Status:      t.Status().String(),
		Priority:    t.Priority().String(),
		ProjectID:   t.ProjectID().Uint(),
		SectionID:   secID,
		Position:    t.Position(),
		AssigneeID:  aid,
		DueDate:     t.DueDate(),
		Subtasks:    subs,
		CreatedAt:   t.CreatedAt(),
		UpdatedAt:   t.UpdatedAt(),
	}
}

func tasksToBriefs(tasks []*task.Task) []TaskBrief {
	out := make([]TaskBrief, 0, len(tasks))
	for _, t := range tasks {
		if t == nil {
			continue
		}
		out = append(out, taskToBrief(t))
	}
	return out
}

// RemoveResult — результат удаления участника (совместимо с прежним API).
type RemoveResult struct {
	Success     bool        `json:"success"`
	MemberID    uint        `json:"member_id,omitempty"`
	TaskCount   int         `json:"task_count,omitempty"`
	Tasks       []TaskBrief `json:"tasks,omitempty"`
	Transferred int         `json:"transferred,omitempty"`
}

// MemberRemovalService — удаление участника с переносом задач (cross-aggregate).
type MemberRemovalService struct {
	Projects project.Repository
	Tasks    task.Repository
	DB       *gorm.DB
	Clock    func() time.Time
}

func NewMemberRemovalService(projects project.Repository, tasks task.Repository, db *gorm.DB) *MemberRemovalService {
	return &MemberRemovalService{
		Projects: projects,
		Tasks:    tasks,
		DB:       db,
		Clock:    time.Now,
	}
}

// Remove удаляет участника с опциональным переносом задач.
func (s *MemberRemovalService) Remove(ctx context.Context, projectID uint, targetUserID uint, mode TaskTransferMode, transferToUserID *uint) (*RemoveResult, error) {
	pid := project.ID(projectID)
	target := user.ID(targetUserID)
	p, err := s.Projects.FindByID(ctx, pid)
	if err != nil {
		return nil, err
	}
	if p.Kind().IsPersonal() {
		return nil, project.ErrPersonalNoMembers
	}
	if p.OwnerID() == target {
		return nil, project.ErrCannotRemoveOwner
	}
	if _, ok, err := s.Projects.GetMemberRole(ctx, pid, target); err != nil {
		return nil, err
	} else if !ok {
		return nil, project.ErrNotMember
	}

	tasks, err := s.Tasks.ListByAssignee(ctx, pid, target)
	if err != nil {
		return nil, err
	}

	if len(tasks) == 0 {
		now := s.Clock()
		if err := p.RemoveMember(target, now); err != nil {
			return nil, err
		}
		if err := s.Projects.Save(ctx, p); err != nil {
			return nil, err
		}
		return &RemoveResult{Success: true, MemberID: targetUserID}, nil
	}

	switch mode {
	case TransferManual:
		return &RemoveResult{
			Success:   false,
			MemberID:  targetUserID,
			TaskCount: len(tasks),
			Tasks:     tasksToBriefs(tasks),
		}, nil

	case TransferUnassigned:
		if err := s.Tasks.ReassignByAssignee(ctx, pid, target, nil); err != nil {
			return nil, err
		}

	case TransferSingleUser:
		if transferToUserID == nil || *transferToUserID == 0 {
			return nil, ErrInvalidInput
		}
		if *transferToUserID == targetUserID {
			return nil, ErrCannotTransferToSelf
		}
		okOwner, err := s.Projects.IsOwner(ctx, pid, user.ID(*transferToUserID))
		if err != nil {
			return nil, err
		}
		okMember, err := s.Projects.AssigneeAllowed(ctx, pid, user.ID(*transferToUserID))
		if err != nil {
			return nil, err
		}
		if !okOwner && !okMember {
			return nil, ErrTargetNotProjectMember
		}
		newID := user.ID(*transferToUserID)
		if err := s.Tasks.ReassignByAssignee(ctx, pid, target, &newID); err != nil {
			return nil, err
		}

	default:
		return nil, ErrInvalidInput
	}

	now := s.Clock()
	p2, err := s.Projects.FindByID(ctx, pid)
	if err != nil {
		return nil, err
	}
	if err := p2.RemoveMember(target, now); err != nil {
		return nil, err
	}
	if err := s.Projects.Save(ctx, p2); err != nil {
		return nil, err
	}
	return &RemoveResult{
		Success:     true,
		MemberID:    targetUserID,
		TaskCount:   len(tasks),
		Transferred: len(tasks),
	}, nil
}

// ApplyManualTaskTransfers применяет ручные переносы и удаляет участника.
func (s *MemberRemovalService) ApplyManualTaskTransfers(ctx context.Context, projectID uint, targetUserID uint, transfers []TaskTransfer) (*RemoveResult, error) {
	pid := project.ID(projectID)
	target := user.ID(targetUserID)

	memberTasks, err := s.Tasks.ListByAssignee(ctx, pid, target)
	if err != nil {
		return nil, err
	}

	if len(memberTasks) == 0 {
		p, err := s.Projects.FindByID(ctx, pid)
		if err != nil {
			return nil, err
		}
		now := s.Clock()
		if err := p.RemoveMember(target, now); err != nil {
			return nil, err
		}
		if err := s.Projects.Save(ctx, p); err != nil {
			return nil, err
		}
		return &RemoveResult{Success: true}, nil
	}

	expectedTaskIDs := make(map[uint]bool)
	for _, t := range memberTasks {
		expectedTaskIDs[t.ID().Uint()] = true
	}

	transferTaskIDs := make(map[uint]bool)
	for _, tr := range transfers {
		if !expectedTaskIDs[tr.TaskID] {
			return nil, ErrInvalidTaskTransfer
		}
		if transferTaskIDs[tr.TaskID] {
			return nil, ErrDuplicateTaskTransfer
		}
		transferTaskIDs[tr.TaskID] = true
		if tr.AssigneeID == targetUserID {
			return nil, ErrCannotTransferToSameMember
		}
		ok, err := s.Projects.AssigneeAllowed(ctx, pid, user.ID(tr.AssigneeID))
		if err != nil {
			return nil, err
		}
		if !ok {
			return nil, ErrInvalidAssignee
		}
	}

	if len(transfers) != len(memberTasks) {
		return nil, ErrIncompleteTaskTransfer
	}

	return s.applyManualInTx(ctx, pid, projectID, targetUserID, target, transfers)
}

func (s *MemberRemovalService) applyManualInTx(ctx context.Context, pid project.ID, projectID uint, targetUserID uint, target user.ID, transfers []TaskTransfer) (*RemoveResult, error) {
	var out *RemoveResult
	err := s.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		txTasks := taskstore.NewGormRepository(tx)
		for _, tr := range transfers {
			aid := user.ID(tr.AssigneeID)
			if err := txTasks.ReassignOne(ctx, task.ID(tr.TaskID), pid, &aid); err != nil {
				return err
			}
		}
		// Тот же *gorm.DB, что и tx, иначе SQLite блокируется (Find/Save на root DB изнутри tx).
		txProjects := projectstore.NewGormRepository(tx)
		p, err := txProjects.FindByID(ctx, pid)
		if err != nil {
			return err
		}
		now := s.Clock()
		if err := p.RemoveMember(target, now); err != nil {
			return err
		}
		if err := txProjects.Save(ctx, p); err != nil {
			return err
		}
		out = &RemoveResult{
			Success:     true,
			MemberID:    targetUserID,
			TaskCount:   len(transfers),
			Transferred: len(transfers),
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	return out, nil
}
