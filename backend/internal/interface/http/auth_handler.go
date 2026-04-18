package handlers

import (
	"net/http"
	"time"

	"task-manager/backend/internal/application"
	"task-manager/backend/internal/domain/user"
	"task-manager/backend/internal/middleware"

	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
	Auth              *application.AuthService
	RefreshCookieName string
	RefreshCookiePath string
	CookieSecure      bool
	RefreshTTL        time.Duration
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

func (h *AuthHandler) writeRefreshCookie(c *gin.Context, plain string) {
	maxAge := int(h.RefreshTTL.Seconds())
	if maxAge < 1 {
		maxAge = int((24 * time.Hour).Seconds())
	}
	c.SetCookie(h.RefreshCookieName, plain, maxAge, h.RefreshCookiePath, "", h.CookieSecure, true)
}

func (h *AuthHandler) clearRefreshCookie(c *gin.Context) {
	c.SetCookie(h.RefreshCookieName, "", -1, h.RefreshCookiePath, "", h.CookieSecure, true)
}

func (h *AuthHandler) refreshCookieValue(c *gin.Context) string {
	v, err := c.Cookie(h.RefreshCookieName)
	if err != nil || v == "" {
		return ""
	}
	return v
}

func (h *AuthHandler) Register(c *gin.Context) {
	var body registerBody
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}
	u, access, refresh, err := h.Auth.Register(c.Request.Context(), body.Email, body.Password, body.Name)
	if err != nil {
		handleServiceError(c, err)
		return
	}
	h.writeRefreshCookie(c, refresh)
	c.JSON(http.StatusCreated, gin.H{
		"access_token": access,
		"user":         userPublic(u),
	})
}

func (h *AuthHandler) Login(c *gin.Context) {
	var body loginBody
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}
	u, access, refresh, err := h.Auth.Login(c.Request.Context(), body.Email, body.Password)
	if err != nil {
		handleServiceError(c, err)
		return
	}
	h.writeRefreshCookie(c, refresh)
	c.JSON(http.StatusOK, gin.H{
		"access_token": access,
		"user":         userPublic(u),
	})
}

func (h *AuthHandler) Refresh(c *gin.Context) {
	plain := h.refreshCookieValue(c)
	if plain == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "missing refresh token"})
		return
	}
	access, err := h.Auth.Refresh(c.Request.Context(), plain)
	if err != nil {
		handleServiceError(c, err)
		return
	}
	h.writeRefreshCookie(c, plain)
	c.JSON(http.StatusOK, gin.H{"access_token": access})
}

func (h *AuthHandler) Logout(c *gin.Context) {
	plain := h.refreshCookieValue(c)
	if plain != "" {
		_ = h.Auth.Logout(c.Request.Context(), plain)
	}
	h.clearRefreshCookie(c)
	c.Status(http.StatusNoContent)
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
	u, err := h.Auth.Me(c.Request.Context(), user.ID(userID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"user": userPublic(u)})
}

type changePasswordBody struct {
	CurrentPassword string `json:"current_password" binding:"required"`
	NewPassword     string `json:"new_password" binding:"required"`
}

func (h *AuthHandler) ChangePassword(c *gin.Context) {
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
	var body changePasswordBody
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}
	if err := h.Auth.ChangePassword(c.Request.Context(), user.ID(userID), body.CurrentPassword, body.NewPassword); err != nil {
		handleServiceError(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}
