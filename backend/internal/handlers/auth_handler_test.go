package handlers_test

import (
	"net/http"
	"testing"

	"task-manager/backend/internal/models"
	"task-manager/backend/internal/testutil"
)

func TestAuth_Register(t *testing.T) {
	app := testutil.NewTestApp(t)

	t.Run("success", func(t *testing.T) {
		rec, data := app.Do(http.MethodPost, "/api/auth/register", map[string]string{
			"email":    "alice@example.com",
			"password": "secret123",
			"name":     "Alice",
		}, "")
		if rec.Code != http.StatusCreated {
			t.Fatalf("expected 201, got %d: %v", rec.Code, data)
		}
		if _, ok := data["token"]; !ok {
			t.Fatalf("expected token in response, got: %v", data)
		}
		if _, ok := data["user"]; !ok {
			t.Fatalf("expected user in response, got: %v", data)
		}
	})

	t.Run("duplicate email", func(t *testing.T) {
		payload := map[string]string{"email": "dup@example.com", "password": "pass1234"}
		app.Do(http.MethodPost, "/api/auth/register", payload, "")
		rec, _ := app.Do(http.MethodPost, "/api/auth/register", payload, "")
		if rec.Code != http.StatusConflict {
			t.Fatalf("expected 409, got %d", rec.Code)
		}
	})

	t.Run("missing password", func(t *testing.T) {
		rec, _ := app.Do(http.MethodPost, "/api/auth/register", map[string]string{
			"email": "nopass@example.com",
		}, "")
		if rec.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", rec.Code)
		}
	})
}

func TestAuth_Login(t *testing.T) {
	app := testutil.NewTestApp(t)
	user, pass := app.SeedUserWithPassword(models.RoleUser, "mypassword1")

	t.Run("success", func(t *testing.T) {
		rec, data := app.Do(http.MethodPost, "/api/auth/login", map[string]string{
			"email":    user.Email,
			"password": pass,
		}, "")
		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d: %v", rec.Code, data)
		}
		tok, ok := data["token"].(string)
		if !ok || tok == "" {
			t.Fatalf("expected non-empty token, got: %v", data)
		}
	})

	t.Run("wrong password", func(t *testing.T) {
		rec, _ := app.Do(http.MethodPost, "/api/auth/login", map[string]string{
			"email":    user.Email,
			"password": "wrong",
		}, "")
		if rec.Code != http.StatusUnauthorized {
			t.Fatalf("expected 401, got %d", rec.Code)
		}
	})

	t.Run("unknown email", func(t *testing.T) {
		rec, _ := app.Do(http.MethodPost, "/api/auth/login", map[string]string{
			"email":    "nobody@example.com",
			"password": "pass",
		}, "")
		if rec.Code != http.StatusUnauthorized {
			t.Fatalf("expected 401, got %d", rec.Code)
		}
	})
}

func TestAuth_Me(t *testing.T) {
	app := testutil.NewTestApp(t)
	user, pass := app.SeedUserWithPassword(models.RoleUser, "pass1234!")
	token := app.Login(user.Email, pass)

	t.Run("authenticated returns user", func(t *testing.T) {
		rec, data := app.Do(http.MethodGet, "/api/me", nil, token)
		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d: %v", rec.Code, data)
		}
		u, ok := data["user"].(map[string]any)
		if !ok {
			t.Fatalf("expected user object, got: %v", data)
		}
		if u["email"] != user.Email {
			t.Fatalf("expected email %s, got %v", user.Email, u["email"])
		}
	})

	t.Run("no token returns 401", func(t *testing.T) {
		rec, _ := app.Do(http.MethodGet, "/api/me", nil, "")
		if rec.Code != http.StatusUnauthorized {
			t.Fatalf("expected 401, got %d", rec.Code)
		}
	})

	t.Run("invalid token returns 401", func(t *testing.T) {
		rec, _ := app.Do(http.MethodGet, "/api/me", nil, "not.a.valid.token")
		if rec.Code != http.StatusUnauthorized {
			t.Fatalf("expected 401, got %d", rec.Code)
		}
	})
}

func TestAuth_ChangePassword(t *testing.T) {
	app := testutil.NewTestApp(t)
	user, pass := app.SeedUserWithPassword(models.RoleUser, "oldpass123")
	token := app.Login(user.Email, pass)

	t.Run("success", func(t *testing.T) {
		rec, _ := app.Do(http.MethodPost, "/api/me/password", map[string]string{
			"current_password": pass,
			"new_password":     "newpass456",
		}, token)
		if rec.Code != http.StatusNoContent {
			t.Fatalf("expected 204, got %d", rec.Code)
		}
		// Старый токен по-прежнему валиден (JWT не инвалидируется при смене пароля),
		// но новый пароль должен работать при повторном входе.
		rec2, _ := app.Do(http.MethodPost, "/api/auth/login", map[string]string{
			"email":    user.Email,
			"password": "newpass456",
		}, "")
		if rec2.Code != http.StatusOK {
			t.Fatalf("login with new password: expected 200, got %d", rec2.Code)
		}
	})

	t.Run("wrong current password", func(t *testing.T) {
		u2, p2 := app.SeedUserWithPassword(models.RoleUser, "original999")
		tok2 := app.Login(u2.Email, p2)
		rec, _ := app.Do(http.MethodPost, "/api/me/password", map[string]string{
			"current_password": "wrong",
			"new_password":     "newpass456",
		}, tok2)
		if rec.Code != http.StatusUnauthorized {
			t.Fatalf("expected 401, got %d", rec.Code)
		}
	})

	t.Run("new password too short", func(t *testing.T) {
		u3, p3 := app.SeedUserWithPassword(models.RoleUser, "longpass999")
		tok3 := app.Login(u3.Email, p3)
		rec, _ := app.Do(http.MethodPost, "/api/me/password", map[string]string{
			"current_password": p3,
			"new_password":     "short",
		}, tok3)
		if rec.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", rec.Code)
		}
	})
}
