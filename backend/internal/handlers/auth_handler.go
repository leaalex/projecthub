package handlers

import (
	"net/http"

	"task-manager/backend/internal/middleware"
	"task-manager/backend/internal/models"
	"task-manager/backend/internal/services"

	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
	Auth *services.AuthService
}

type registerBody struct {
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required"`
	Name     string `json:"name"`
}

type loginBody struct {
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required"`
}

func (h *AuthHandler) Register(c *gin.Context) {
	var body registerBody
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}
	u, token, err := h.Auth.Register(body.Email, body.Password, body.Name)
	if err != nil {
		switch err {
		case services.ErrEmailTaken:
			c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
		case services.ErrInvalidInput:
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "registration failed"})
		}
		return
	}
	c.JSON(http.StatusCreated, gin.H{
		"token": token,
		"user":  userResponse(u),
	})
}

func (h *AuthHandler) Login(c *gin.Context) {
	var body loginBody
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}
	u, token, err := h.Auth.Login(body.Email, body.Password)
	if err != nil {
		switch err {
		case services.ErrInvalidCreds, services.ErrInvalidInput:
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid email or password"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "login failed"})
		}
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"token": token,
		"user":  userResponse(u),
	})
}

func (h *AuthHandler) Me(c *gin.Context) {
	uid, ok := c.Get(middleware.ContextUserIDKey)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID, ok := uid.(uint)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	u, err := h.Auth.UserByID(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"user": userResponse(u)})
}

func userResponse(u *models.User) gin.H {
	return gin.H{
		"id":    u.ID,
		"email": u.Email,
		"name":  u.Name,
		"role":  u.Role,
	}
}
