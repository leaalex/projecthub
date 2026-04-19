package project

import (
	"fmt"
	"strings"
)

// Role — роль участника внутри проекта (не глобальная user.Role).
type Role string

const (
	RoleManager  Role = "manager"
	RoleExecutor Role = "executor"
	RoleViewer   Role = "viewer"
)

func ParseRole(s string) (Role, error) {
	switch strings.TrimSpace(strings.ToLower(s)) {
	case string(RoleManager):
		return RoleManager, nil
	case string(RoleExecutor):
		return RoleExecutor, nil
	case string(RoleViewer):
		return RoleViewer, nil
	default:
		return "", fmt.Errorf("unknown project role: %q", s)
	}
}

func (r Role) String() string { return string(r) }

func (r Role) IsValid() bool {
	switch r {
	case RoleManager, RoleExecutor, RoleViewer:
		return true
	default:
		return false
	}
}
