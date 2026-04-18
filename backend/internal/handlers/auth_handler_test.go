package handlers_test

import (
	"net/http"
	"testing"

	domainuser "task-manager/backend/internal/domain/user"
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
		if _, ok := data["access_token"]; !ok {
			t.Fatalf("expected access_token in response, got: %v", data)
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
	usr, pass := app.SeedUserWithPassword(domainuser.RoleUser, "mypassword1")

	t.Run("success", func(t *testing.T) {
		rec, data := app.Do(http.MethodPost, "/api/auth/login", map[string]string{
			"email":    usr.Email().String(),
			"password": pass,
		}, "")
		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d: %v", rec.Code, data)
		}
		tok, ok := data["access_token"].(string)
		if !ok || tok == "" {
			t.Fatalf("expected non-empty access_token, got: %v", data)
		}
	})

	t.Run("wrong password", func(t *testing.T) {
		rec, _ := app.Do(http.MethodPost, "/api/auth/login", map[string]string{
			"email":    usr.Email().String(),
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

func TestAuth_Login_SetsRefreshCookie(t *testing.T) {
	app := testutil.NewTestApp(t)
	usr, pass := app.SeedUserWithPassword(domainuser.RoleUser, "pass123")
	rec, _ := app.Do(http.MethodPost, "/api/auth/login", map[string]string{
		"email": usr.Email().String(), "password": pass,
	}, "")
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}
	resp := rec.Result()
	defer resp.Body.Close()
	var found bool
	for _, ck := range resp.Cookies() {
		if ck.Name == "refresh_token" && ck.HttpOnly && ck.Path == "/api/auth" {
			found = true
			if ck.MaxAge < 60 {
				t.Fatalf("expected reasonable Max-Age, got %d", ck.MaxAge)
			}
		}
	}
	if !found {
		t.Fatal("expected HttpOnly refresh_token cookie with path /api/auth")
	}
}

func TestAuth_Refresh_IssuesNewAccess(t *testing.T) {
	app := testutil.NewTestApp(t)
	usr, pass := app.SeedUserWithPassword(domainuser.RoleUser, "pass456")
	_, refresh := app.Login(usr.Email().String(), pass)
	if refresh == nil {
		t.Fatal("expected refresh cookie from login")
	}
	rec, data := app.DoWithCookie(http.MethodPost, "/api/auth/refresh", nil, "", refresh)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %v", rec.Code, data)
	}
	if tok, ok := data["access_token"].(string); !ok || tok == "" {
		t.Fatalf("expected new non-empty access_token, got %v", data)
	}
}

func TestAuth_Refresh_NoCookie_401(t *testing.T) {
	app := testutil.NewTestApp(t)
	rec, _ := app.Do(http.MethodPost, "/api/auth/refresh", nil, "")
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", rec.Code)
	}
}

func TestAuth_Logout_ClearsCookie(t *testing.T) {
	app := testutil.NewTestApp(t)
	usr, pass := app.SeedUserWithPassword(domainuser.RoleUser, "pass789")
	_, refresh := app.Login(usr.Email().String(), pass)
	rec, _ := app.DoWithCookie(http.MethodPost, "/api/auth/logout", nil, "", refresh)
	if rec.Code != http.StatusNoContent {
		t.Fatalf("expected 204, got %d", rec.Code)
	}
	resp := rec.Result()
	defer resp.Body.Close()
	for _, ck := range resp.Cookies() {
		if ck.Name == "refresh_token" && ck.MaxAge < 0 {
			return
		}
	}
	t.Fatal("expected Set-Cookie clearing refresh_token")
}

func TestAuth_Refresh_AfterLogout_401(t *testing.T) {
	app := testutil.NewTestApp(t)
	usr, pass := app.SeedUserWithPassword(domainuser.RoleUser, "pass000")
	_, refresh := app.Login(usr.Email().String(), pass)
	recLogout, _ := app.DoWithCookie(http.MethodPost, "/api/auth/logout", nil, "", refresh)
	if recLogout.Code != http.StatusNoContent {
		t.Fatalf("logout: %d", recLogout.Code)
	}
	rec, _ := app.DoWithCookie(http.MethodPost, "/api/auth/refresh", nil, "", refresh)
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 after logout, got %d", rec.Code)
	}
}

func TestAuth_Me(t *testing.T) {
	app := testutil.NewTestApp(t)
	usr, pass := app.SeedUserWithPassword(domainuser.RoleUser, "pass1234!")
	token, _ := app.Login(usr.Email().String(), pass)

	t.Run("authenticated returns user", func(t *testing.T) {
		rec, data := app.Do(http.MethodGet, "/api/me", nil, token)
		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d: %v", rec.Code, data)
		}
		u, ok := data["user"].(map[string]any)
		if !ok {
			t.Fatalf("expected user object, got: %v", data)
		}
		if u["email"] != usr.Email().String() {
			t.Fatalf("expected email %s, got %v", usr.Email().String(), u["email"])
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
	usr, pass := app.SeedUserWithPassword(domainuser.RoleUser, "oldpass123")
	token, _ := app.Login(usr.Email().String(), pass)

	t.Run("success", func(t *testing.T) {
		rec, _ := app.Do(http.MethodPost, "/api/me/password", map[string]string{
			"current_password": pass,
			"new_password":     "newpass456",
		}, token)
		if rec.Code != http.StatusNoContent {
			t.Fatalf("expected 204, got %d", rec.Code)
		}
		rec2, _ := app.Do(http.MethodPost, "/api/auth/login", map[string]string{
			"email":    usr.Email().String(),
			"password": "newpass456",
		}, "")
		if rec2.Code != http.StatusOK {
			t.Fatalf("login with new password: expected 200, got %d", rec2.Code)
		}
	})

	t.Run("wrong current password", func(t *testing.T) {
		u2, p2 := app.SeedUserWithPassword(domainuser.RoleUser, "original999")
		tok2, _ := app.Login(u2.Email().String(), p2)
		rec, _ := app.Do(http.MethodPost, "/api/me/password", map[string]string{
			"current_password": "wrong",
			"new_password":     "newpass456",
		}, tok2)
		if rec.Code != http.StatusUnauthorized {
			t.Fatalf("expected 401, got %d", rec.Code)
		}
	})

	t.Run("new password too short", func(t *testing.T) {
		u3, p3 := app.SeedUserWithPassword(domainuser.RoleUser, "longpass999")
		tok3, _ := app.Login(u3.Email().String(), p3)
		rec, _ := app.Do(http.MethodPost, "/api/me/password", map[string]string{
			"current_password": p3,
			"new_password":     "short",
		}, tok3)
		if rec.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", rec.Code)
		}
	})
}
