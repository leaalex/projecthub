package services

import (
	"errors"
	"strings"

	"task-manager/backend/internal/models"

	"gorm.io/gorm"
)

var (
	ErrAlreadyProjectMember              = errors.New("user is already a project member")
	ErrTargetUserNotFound              = errors.New("user not found")
	ErrNotProjectMember                = errors.New("user is not a member of this project")
	ErrCannotRemoveOwner               = errors.New("cannot remove project owner")
	ErrPersonalProjectMembersNotAllowed = errors.New("personal projects do not support members")
	ErrCannotTransferToSelf            = errors.New("cannot transfer tasks to the member being removed")
	ErrTargetNotProjectMember          = errors.New("transfer target must be a project member or owner")
	ErrInvalidTaskTransfer             = errors.New("task does not belong to the member being removed")
	ErrDuplicateTaskTransfer           = errors.New("duplicate task in transfer list")
	ErrCannotTransferToSameMember      = errors.New("cannot assign task to the member being removed")
	ErrInvalidAssignee                 = errors.New("assignee must be a project member or owner")
	ErrIncompleteTaskTransfer          = errors.New("all tasks must be reassigned before removing member")
)

// ProjectMemberService управляет строками project_members и проверками членства.
type ProjectMemberService struct {
	DB *gorm.DB
}

// ProjectKind возвращает тип проекта.
func (m *ProjectMemberService) ProjectKind(projectID uint) (models.ProjectKind, error) {
	var p models.Project
	if err := m.DB.Select("kind").First(&p, projectID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return "", ErrProjectNotFound
		}
		return "", err
	}
	return p.Kind, nil
}

// List возвращает всех участников проекта с предзагруженным User.
func (m *ProjectMemberService) List(projectID uint) ([]models.ProjectMember, error) {
	var list []models.ProjectMember
	err := m.DB.Where("project_id = ?", projectID).Preload("User").Order("project_members.id ASC").Find(&list).Error
	return list, err
}

// Add добавляет строку членства; возвращает ошибку, если пользователь уже является участником.
func (m *ProjectMemberService) Add(projectID, userID uint, role models.ProjectRole) (*models.ProjectMember, error) {
	if !models.IsValidProjectRole(role) {
		return nil, ErrInvalidInput
	}
	var p models.Project
	if err := m.DB.First(&p, projectID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrProjectNotFound
		}
		return nil, err
	}
	if p.Kind == models.ProjectKindPersonal {
		return nil, ErrPersonalProjectMembersNotAllowed
	}
	if p.OwnerID == userID {
		return nil, ErrForbidden
	}
	var existing int64
	if err := m.DB.Model(&models.ProjectMember{}).Where("project_id = ? AND user_id = ?", projectID, userID).Count(&existing).Error; err != nil {
		return nil, err
	}
	if existing > 0 {
		return nil, ErrAlreadyProjectMember
	}
	pm := models.ProjectMember{
		ProjectID: projectID,
		UserID:    userID,
		Role:      role,
	}
	if err := m.DB.Create(&pm).Error; err != nil {
		return nil, err
	}
	if err := m.DB.Preload("User").First(&pm, pm.ID).Error; err != nil {
		return nil, err
	}
	return &pm, nil
}

// UpdateRole изменяет роль участника; владелец в этой таблице не хранится.
func (m *ProjectMemberService) UpdateRole(projectID, userID uint, newRole models.ProjectRole) (*models.ProjectMember, error) {
	if !models.IsValidProjectRole(newRole) {
		return nil, ErrInvalidInput
	}
	var p models.Project
	if err := m.DB.First(&p, projectID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrProjectNotFound
		}
		return nil, err
	}
	if p.Kind == models.ProjectKindPersonal {
		return nil, ErrPersonalProjectMembersNotAllowed
	}
	if p.OwnerID == userID {
		return nil, ErrForbidden
	}
	var pm models.ProjectMember
	if err := m.DB.Where("project_id = ? AND user_id = ?", projectID, userID).First(&pm).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrNotProjectMember
		}
		return nil, err
	}
	pm.Role = newRole
	if err := m.DB.Save(&pm).Error; err != nil {
		return nil, err
	}
	if err := m.DB.Preload("User").First(&pm, pm.ID).Error; err != nil {
		return nil, err
	}
	return &pm, nil
}

// RemoveResult содержит результат попытки удаления участника
type RemoveResult struct {
	Success     bool           `json:"success"`
	MemberID    uint           `json:"member_id,omitempty"`
	TaskCount   int            `json:"task_count,omitempty"`
	Tasks       []models.Task  `json:"tasks,omitempty"`       // Заполняется в ручном режиме
	Transferred int            `json:"transferred,omitempty"`   // Количество переназначенных задач
}

// Remove удаляет участника проекта с опциональным переносом задач.
// В ручном режиме возвращает список задач без удаления участника (двухшаговый процесс).
func (m *ProjectMemberService) Remove(projectID, userID uint, mode models.TaskTransferMode, transferToUserID *uint) (*RemoveResult, error) {
	// 1. Проверяем, что проект и участник существуют
	var p models.Project
	if err := m.DB.First(&p, projectID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrProjectNotFound
		}
		return nil, err
	}
	if p.Kind == models.ProjectKindPersonal {
		return nil, ErrPersonalProjectMembersNotAllowed
	}
	if p.OwnerID == userID {
		return nil, ErrCannotRemoveOwner
	}

	// 2. Проверяем, что участник существует
	var pm models.ProjectMember
	if err := m.DB.Where("project_id = ? AND user_id = ?", projectID, userID).First(&pm).Error; err != nil {
		return nil, ErrNotProjectMember
	}

	// 3. Получаем задачи участника
	var tasks []models.Task
	if err := m.DB.Where("project_id = ? AND assignee_id = ?", projectID, userID).Find(&tasks).Error; err != nil {
		return nil, err
	}

	// 4. Нет задач — простое удаление
	if len(tasks) == 0 {
		res := m.DB.Where("project_id = ? AND user_id = ?", projectID, userID).Delete(&models.ProjectMember{})
		if res.Error != nil {
			return nil, res.Error
		}
		if res.RowsAffected == 0 {
			return nil, ErrNotProjectMember
		}
		return &RemoveResult{Success: true, MemberID: userID}, nil
	}

	// 5. Есть задачи — обрабатываем в зависимости от режима
	switch mode {
	case models.TransferManual:
		// Возвращаем задачи без удаления участника (клиент покажет UI выбора)
		return &RemoveResult{
			Success:   false, // Операция ещё не завершена
			MemberID:  userID,
			TaskCount: len(tasks),
			Tasks:     tasks,
		}, nil

	case models.TransferUnassigned:
		// Устанавливаем всем задачам назначенного в NULL
		if err := m.DB.Model(&models.Task{}).
			Where("project_id = ? AND assignee_id = ?", projectID, userID).
			Update("assignee_id", nil).Error; err != nil {
			return nil, err
		}

	case models.TransferSingleUser:
		// Проверяем целевого пользователя
		if transferToUserID == nil || *transferToUserID == 0 {
			return nil, ErrInvalidInput
		}
		if *transferToUserID == userID {
			return nil, ErrCannotTransferToSelf
		}
		// Проверяем, что цель — участник или владелец проекта
		isMember := m.IsMember(projectID, *transferToUserID)
		isOwner := p.OwnerID == *transferToUserID
		if !isMember && !isOwner {
			return nil, ErrTargetNotProjectMember
		}
		// Обновляем все задачи
		if err := m.DB.Model(&models.Task{}).
			Where("project_id = ? AND assignee_id = ?", projectID, userID).
			Update("assignee_id", *transferToUserID).Error; err != nil {
			return nil, err
		}
	}

	// 6. Удаляем участника после успешного переноса
	res := m.DB.Where("project_id = ? AND user_id = ?", projectID, userID).Delete(&models.ProjectMember{})
	if res.Error != nil {
		return nil, res.Error
	}
	if res.RowsAffected == 0 {
		return nil, ErrNotProjectMember
	}

	return &RemoveResult{
		Success:     true,
		MemberID:    userID,
		TaskCount:   len(tasks),
		Transferred: len(tasks),
	}, nil
}

// ApplyManualTaskTransfers применяет переназначения задач и удаляет участника.
// Валидация: все задачи должны быть переназначены, новые назначенные должны быть действительными участниками.
func (m *ProjectMemberService) ApplyManualTaskTransfers(projectID, userID uint, transfers []models.TaskTransfer) (*RemoveResult, error) {
	// 1. Получаем все задачи, назначенные этому участнику
	var memberTasks []models.Task
	if err := m.DB.Where("project_id = ? AND assignee_id = ?", projectID, userID).Find(&memberTasks).Error; err != nil {
		return nil, err
	}
	if len(memberTasks) == 0 {
		// Нет задач — просто удаляем участника
		res := m.DB.Where("project_id = ? AND user_id = ?", projectID, userID).Delete(&models.ProjectMember{})
		if res.Error != nil {
			return nil, res.Error
		}
		return &RemoveResult{Success: true}, nil
	}

	// 2. Строим карту ожидаемых ID задач
	expectedTaskIDs := make(map[uint]bool)
	for _, t := range memberTasks {
		expectedTaskIDs[t.ID] = true
	}

	// 3. Валидируем переносы
	transferTaskIDs := make(map[uint]bool)
	for _, tr := range transfers {
		// Проверяем, что задача принадлежит участнику
		if !expectedTaskIDs[tr.TaskID] {
			return nil, ErrInvalidTaskTransfer
		}
		// Проверяем дубликаты
		if transferTaskIDs[tr.TaskID] {
			return nil, ErrDuplicateTaskTransfer
		}
		transferTaskIDs[tr.TaskID] = true

		// Проверяем нового назначенного
		if tr.AssigneeID == userID {
			return nil, ErrCannotTransferToSameMember
		}
		// Проверяем, что назначенный — действительный участник или владелец проекта
		var p models.Project
		m.DB.First(&p, projectID)
		isMember := m.IsMember(projectID, tr.AssigneeID)
		isOwner := p.OwnerID == tr.AssigneeID
		if !isMember && !isOwner {
			return nil, ErrInvalidAssignee
		}
	}

	// 4. Проверяем, что ВСЕ задачи охвачены
	if len(transfers) != len(memberTasks) {
		return nil, ErrIncompleteTaskTransfer
	}

	// 5. Применяем обновления в транзакции
	tx := m.DB.Begin()
	for _, tr := range transfers {
		if err := tx.Model(&models.Task{}).
			Where("id = ? AND project_id = ?", tr.TaskID, projectID).
			Update("assignee_id", tr.AssigneeID).Error; err != nil {
			tx.Rollback()
			return nil, err
		}
	}

	// 6. Удаляем участника
	res := tx.Where("project_id = ? AND user_id = ?", projectID, userID).Delete(&models.ProjectMember{})
	if res.Error != nil {
		tx.Rollback()
		return nil, res.Error
	}
	if res.RowsAffected == 0 {
		tx.Rollback()
		return nil, ErrNotProjectMember
	}

	tx.Commit()
	return &RemoveResult{
		Success:     true,
		MemberID:    userID,
		TaskCount:   len(memberTasks),
		Transferred: len(transfers),
	}, nil
}

// GetMemberRole возвращает роль участника и true, если у него есть строка в project_members.
func (m *ProjectMemberService) GetMemberRole(projectID, userID uint) (models.ProjectRole, bool) {
	var pm models.ProjectMember
	if err := m.DB.Select("role").Where("project_id = ? AND user_id = ?", projectID, userID).First(&pm).Error; err != nil {
		return "", false
	}
	return pm.Role, true
}

// IsMember возвращает true, если у пользователя есть строка в project_members (владелец не включается).
func (m *ProjectMemberService) IsMember(projectID, userID uint) bool {
	_, ok := m.GetMemberRole(projectID, userID)
	return ok
}

// IsOwnerOrMember возвращает true, если пользователь владеет проектом или имеет строку в members.
func (m *ProjectMemberService) IsOwnerOrMember(projectID, userID uint) bool {
	var p models.Project
	if err := m.DB.First(&p, projectID).Error; err != nil {
		return false
	}
	if p.OwnerID == userID {
		return true
	}
	return m.IsMember(projectID, userID)
}

// CanAccessProject возвращает true для admin/staff, владельца или любого участника (включая наблюдателя).
func (m *ProjectMemberService) CanAccessProject(projectID, userID uint, globalRole models.Role) bool {
	if models.IsSystemRole(globalRole) {
		return true
	}
	return m.IsOwnerOrMember(projectID, userID)
}

// CanManageMembers возвращает true для admin/staff, владельца проекта или участника с ролью менеджера.
func (m *ProjectMemberService) CanManageMembers(projectID, userID uint, globalRole models.Role) bool {
	if models.IsSystemRole(globalRole) {
		return true
	}
	var p models.Project
	if err := m.DB.First(&p, projectID).Error; err != nil {
		return false
	}
	if p.OwnerID == userID {
		return true
	}
	r, ok := m.GetMemberRole(projectID, userID)
	return ok && r == models.ProjectRoleManager
}

// CallerProjectRoleString возвращает стабильную метку для API-ответов (owner / manager / executor / viewer / admin / staff).
func (m *ProjectMemberService) CallerProjectRoleString(projectID, callerID uint, globalRole models.Role) string {
	switch globalRole {
	case models.RoleAdmin:
		return "admin"
	case models.RoleStaff:
		return "staff"
	}
	var p models.Project
	if err := m.DB.First(&p, projectID).Error; err != nil {
		return ""
	}
	if p.OwnerID == callerID {
		return "owner"
	}
	if r, ok := m.GetMemberRole(projectID, callerID); ok {
		return string(r)
	}
	return ""
}

// MemberProjectIDs возвращает ID проектов, в которых у пользователя есть строка членства.
func (m *ProjectMemberService) MemberProjectIDs(userID uint) ([]uint, error) {
	var ids []uint
	err := m.DB.Model(&models.ProjectMember{}).Where("user_id = ?", userID).Pluck("project_id", &ids).Error
	return ids, err
}

// TransferOwnership устанавливает нового владельца (только admin/staff на уровне обработчика).
// Предыдущему владельцу гарантируется членство в роли менеджера, чтобы он сохранил доступ.
func (m *ProjectMemberService) TransferOwnership(projectID, newOwnerID, callerID uint, globalRole models.Role) error {
	if !models.IsSystemRole(globalRole) {
		return ErrForbidden
	}
	var p models.Project
	if err := m.DB.First(&p, projectID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrProjectNotFound
		}
		return err
	}
	if err := m.DB.First(&models.User{}, newOwnerID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrTargetUserNotFound
		}
		return err
	}
	oldOwnerID := p.OwnerID
	if oldOwnerID == newOwnerID {
		return ErrInvalidInput
	}
	return m.DB.Transaction(func(tx *gorm.DB) error {
		if oldOwnerID != newOwnerID {
			var n int64
			if err := tx.Model(&models.ProjectMember{}).Where("project_id = ? AND user_id = ?", projectID, oldOwnerID).Count(&n).Error; err != nil {
				return err
			}
			if n == 0 {
				pm := models.ProjectMember{
					ProjectID: projectID,
					UserID:    oldOwnerID,
					Role:      models.ProjectRoleManager,
				}
				if err := tx.Create(&pm).Error; err != nil {
					return err
				}
			} else {
				if err := tx.Model(&models.ProjectMember{}).Where("project_id = ? AND user_id = ?", projectID, oldOwnerID).Update("role", models.ProjectRoleManager).Error; err != nil {
					return err
				}
			}
		}
		if err := tx.Model(&models.Project{}).Where("id = ?", projectID).Update("owner_id", newOwnerID).Error; err != nil {
			return err
		}
		// Новый владелец не должен оставаться в таблице как viewer/executor — удаляем дубликат строки участника, если есть.
		if err := tx.Where("project_id = ? AND user_id = ?", projectID, newOwnerID).Delete(&models.ProjectMember{}).Error; err != nil {
			return err
		}
		return nil
	})
}

// ResolveUserIDByEmail находит пользователя по email (без учёта регистра и пробелов).
func (m *ProjectMemberService) ResolveUserIDByEmail(email string) (uint, error) {
	email = strings.TrimSpace(strings.ToLower(email))
	if email == "" {
		return 0, ErrInvalidInput
	}
	var u models.User
	if err := m.DB.Where("LOWER(email) = ?", email).First(&u).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return 0, ErrTargetUserNotFound
		}
		return 0, err
	}
	return u.ID, nil
}

// AssigneeAllowedOnProject возвращает true, если назначаемый — владелец или участник проекта.
func (m *ProjectMemberService) AssigneeAllowedOnProject(projectID, assigneeID uint) (bool, error) {
	var p models.Project
	if err := m.DB.First(&p, projectID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return false, ErrProjectNotFound
		}
		return false, err
	}
	if p.OwnerID == assigneeID {
		return true, nil
	}
	return m.IsMember(projectID, assigneeID), nil
}
