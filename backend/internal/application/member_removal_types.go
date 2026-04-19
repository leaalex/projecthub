package application

// TaskTransferMode — как обработать задачи при удалении участника.
type TaskTransferMode string

const (
	TransferUnassigned TaskTransferMode = "unassigned"
	TransferSingleUser TaskTransferMode = "single_user"
	TransferManual     TaskTransferMode = "manual"
)

// TaskTransferRequest — тело DELETE /members/:user_id.
type TaskTransferRequest struct {
	TransferMode     TaskTransferMode `json:"transfer_mode" binding:"required,oneof=unassigned single_user manual"`
	TransferToUserID *uint            `json:"transfer_to_user_id,omitempty"`
}

// TaskTransfer — одно переназначение в ручном режиме.
type TaskTransfer struct {
	TaskID     uint `json:"task_id" binding:"required"`
	AssigneeID uint `json:"assignee_id" binding:"required,min=1"`
}

// TaskTransferBatch — POST .../transfer-tasks.
type TaskTransferBatch struct {
	Transfers []TaskTransfer `json:"transfers" binding:"required,min=1"`
}
