package handler

import (
	"errors"
	"net/http"
	"strconv"
	"strings"

	"task-manager/backend/internal/application"
	"task-manager/backend/internal/domain/user"

	"github.com/gin-gonic/gin"
)

type UserHandler struct {
	Svc *application.UserService
}

type userUpdateBody struct {
	Name       *string `json:"name"`
	Email      *string `json:"email"`
	LastName   *string `json:"last_name"`
	FirstName  *string `json:"first_name"`
	Patronymic *string `json:"patronymic"`
	Department *string `json:"department"`
	JobTitle   *string `json:"job_title"`
	Phone      *string `json:"phone"`
	Locale     *string `json:"locale"`
	Password   *string `json:"password"`
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

func userPublic(u *user.User) gin.H {
	return gin.H{
		"id":         u.ID().Uint(),
		"email":      u.Email().String(),
		"name":       u.Name().DisplayName(),
		"last_name":  u.Name().LastName,
		"first_name": u.Name().FirstName,
		"patronymic": u.Name().Patronymic,
		"department": u.Department(),
		"job_title":  u.JobTitle(),
		"phone":      u.Phone(),
		"locale":     u.Locale().String(),
		"role":       u.Role().String(),
		"created_at": u.CreatedAt(),
		"updated_at": u.UpdatedAt(),
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
	r, err := user.ParseRole(strings.TrimSpace(body.Role))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid role"})
		return
	}
	u, err := h.Svc.AdminCreate(c.Request.Context(), role, application.AdminCreateInput{
		Email:      body.Email,
		Password:   body.Password,
		Role:       r,
		LastName:   body.LastName,
		FirstName:  body.FirstName,
		Patronymic: body.Patronymic,
		Department: body.Department,
		JobTitle:   body.JobTitle,
		Phone:      body.Phone,
	})
	if err != nil {
		handleServiceError(c, err)
		return
	}
	c.JSON(http.StatusCreated, gin.H{"user": userPublic(u)})
}

func (h *UserHandler) List(c *gin.Context) {
	list, err := h.Svc.List(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	out := make([]gin.H, 0, len(list))
	for _, u := range list {
		out = append(out, userPublic(u))
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
	targetID := user.ID(uint(id))
	if !h.Svc.CanAccessUser(user.ID(callerID), role, targetID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		return
	}
	u, err := h.Svc.Get(c.Request.Context(), targetID)
	if err != nil {
		if errors.Is(err, user.ErrUserNotFound) {
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
	patch := application.UserProfilePatch{
		Name:       body.Name,
		Email:      body.Email,
		LastName:   body.LastName,
		FirstName:  body.FirstName,
		Patronymic: body.Patronymic,
		Department: body.Department,
		JobTitle:   body.JobTitle,
		Phone:      body.Phone,
		Locale:     body.Locale,
		Password:   body.Password,
	}
	u, err := h.Svc.Update(c.Request.Context(), user.ID(uint(id)), user.ID(callerID), role, patch)
	if err != nil {
		handleServiceError(c, err)
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
	if err := h.Svc.Delete(c.Request.Context(), user.ID(uint(id)), user.ID(callerID), role); err != nil {
		handleServiceError(c, err)
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
	newRole, err := user.ParseRole(strings.TrimSpace(body.Role))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid role"})
		return
	}
	u, err := h.Svc.SetGlobalRole(c.Request.Context(), user.ID(uint(id)), user.ID(callerID), role, newRole)
	if err != nil {
		handleServiceError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"user": userPublic(u)})
}
