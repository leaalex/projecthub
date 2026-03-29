package handlers

import (
	"net/http"
	"strconv"

	"task-manager/backend/internal/models"
	"task-manager/backend/internal/services"

	"github.com/gin-gonic/gin"
)

type UserHandler struct {
	Svc *services.UserService
}

type userUpdateBody struct {
	Name        *string `json:"name"`
	Email       *string `json:"email"`
	LastName    *string `json:"last_name"`
	FirstName   *string `json:"first_name"`
	Patronymic  *string `json:"patronymic"`
	Department  *string `json:"department"`
	JobTitle    *string `json:"job_title"`
	Phone       *string `json:"phone"`
	Password    *string `json:"password"`
}

type userCreateBody struct {
	Email      string `json:"email" binding:"required"`
	Password   string `json:"password" binding:"required"`
	Role       string `json:"role"`
	LastName   string `json:"last_name"`
	FirstName  string `json:"first_name"`
	Patronymic string `json:"patronymic"`
	Department string `json:"department"`
	JobTitle   string `json:"job_title"`
	Phone      string `json:"phone"`
}

func userPublic(u *models.User) gin.H {
	return gin.H{
		"id":          u.ID,
		"email":       u.Email,
		"name":        models.UserDisplayName(u),
		"last_name":   u.LastName,
		"first_name":  u.FirstName,
		"patronymic":  u.Patronymic,
		"department":  u.Department,
		"job_title":   u.JobTitle,
		"phone":       u.Phone,
		"role":        u.Role,
		"created_at":  u.CreatedAt,
		"updated_at":  u.UpdatedAt,
	}
}

func (h *UserHandler) Create(c *gin.Context) {
	_, ok := ctxUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	role, ok := ctxRole(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	var body userCreateBody
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}
	u, err := h.Svc.AdminCreate(role, services.AdminCreateInput{
		Email:      body.Email,
		Password:   body.Password,
		Role:       models.Role(body.Role),
		LastName:   body.LastName,
		FirstName:  body.FirstName,
		Patronymic: body.Patronymic,
		Department: body.Department,
		JobTitle:   body.JobTitle,
		Phone:      body.Phone,
	})
	if err != nil {
		switch err {
		case services.ErrForbidden:
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		case services.ErrInvalidInput, services.ErrInvalidGlobalRole:
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		case services.ErrEmailTaken:
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}
	c.JSON(http.StatusCreated, gin.H{"user": userPublic(u)})
}

func (h *UserHandler) List(c *gin.Context) {
	list, err := h.Svc.List()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	out := make([]gin.H, 0, len(list))
	for i := range list {
		out = append(out, userPublic(&list[i]))
	}
	c.JSON(http.StatusOK, gin.H{"users": out})
}

func (h *UserHandler) Get(c *gin.Context) {
	callerID, ok := ctxUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	role, ok := ctxRole(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "bad id"})
		return
	}
	if !h.Svc.CanAccessUser(callerID, role, uint(id)) {
		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		return
	}
	u, err := h.Svc.Get(uint(id))
	if err != nil {
		if err == services.ErrUserNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"user": userPublic(u)})
}

func (h *UserHandler) Update(c *gin.Context) {
	callerID, ok := ctxUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	role, ok := ctxRole(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "bad id"})
		return
	}
	var body userUpdateBody
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}
	patch := services.UserProfilePatch{
		Name:        body.Name,
		Email:       body.Email,
		LastName:    body.LastName,
		FirstName:   body.FirstName,
		Patronymic:  body.Patronymic,
		Department:  body.Department,
		JobTitle:    body.JobTitle,
		Phone:       body.Phone,
		Password:    body.Password,
	}
	u, err := h.Svc.Update(uint(id), callerID, role, patch)
	if err != nil {
		if err == services.ErrForbidden {
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
			return
		}
		if err == services.ErrUserNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		if err == services.ErrInvalidInput || err == services.ErrEmailTaken {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"user": userPublic(u)})
}

func (h *UserHandler) Delete(c *gin.Context) {
	callerID, ok := ctxUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	role, ok := ctxRole(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "bad id"})
		return
	}
	if err := h.Svc.Delete(uint(id), callerID, role); err != nil {
		if err == services.ErrForbidden {
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
			return
		}
		if err == services.ErrCannotDeleteSelf {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		if err == services.ErrUserNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}

type setRoleBody struct {
	Role string `json:"role" binding:"required"`
}

func (h *UserHandler) SetRole(c *gin.Context) {
	callerID, ok := ctxUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	role, ok := ctxRole(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "bad id"})
		return
	}
	var body setRoleBody
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}
	u, err := h.Svc.SetGlobalRole(uint(id), callerID, role, models.Role(body.Role))
	if err != nil {
		switch err {
		case services.ErrForbidden:
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		case services.ErrCannotChangeOwnRole:
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		case services.ErrInvalidGlobalRole:
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		case services.ErrUserNotFound:
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}
	c.JSON(http.StatusOK, gin.H{"user": userPublic(u)})
}
