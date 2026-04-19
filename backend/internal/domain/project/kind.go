package project

import (
	"fmt"
	"strings"
)

// Kind — тип проекта: личный или командный.
type Kind string

const (
	KindPersonal Kind = "personal"
	KindTeam     Kind = "team"
)

func ParseKind(s string) (Kind, error) {
	switch strings.TrimSpace(strings.ToLower(s)) {
	case "", string(KindTeam):
		return KindTeam, nil
	case string(KindPersonal):
		return KindPersonal, nil
	default:
		return "", fmt.Errorf("unknown project kind: %q", s)
	}
}

func (k Kind) String() string { return string(k) }

func (k Kind) IsPersonal() bool { return k == KindPersonal }
func (k Kind) IsTeam() bool     { return k == KindTeam }
