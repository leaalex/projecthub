package handler

import (
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestHandleServiceError_SQLiteForeignKey(t *testing.T) {
	gin.SetMode(gin.TestMode)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	handleServiceError(c, errors.New("FOREIGN KEY constraint failed"))
	if w.Code != http.StatusConflict {
		t.Fatalf("expected 409, got %d body=%s", w.Code, w.Body.String())
	}
	var body map[string]any
	if err := json.Unmarshal(w.Body.Bytes(), &body); err != nil {
		t.Fatal(err)
	}
	if body["error"] != "foreign_key_violation" {
		t.Fatalf("unexpected error code: %v", body["error"])
	}
}

func TestHandleServiceError_DefaultLogsWithError(t *testing.T) {
	gin.SetMode(gin.TestMode)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	handleServiceError(c, errors.New("some internal failure"))
	if w.Code != http.StatusInternalServerError {
		t.Fatalf("expected 500, got %d", w.Code)
	}
	if len(c.Errors) != 1 {
		t.Fatalf("expected 1 gin error for logging, got %d", len(c.Errors))
	}
}
