package api

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"interactiveworkout/api/internal/store"
)

// validRef is a 24-char URL-safe base64 string used across tests.
const validRef = "ABCDEFGHIJKLMNOPQRSTUVWX"

type mockStore struct {
	input store.Input
	calls int
	err   error
}

func (m *mockStore) Create(_ context.Context, input store.Input, _ string, code string) (store.Result, error) {
	m.input = input
	m.calls++
	return store.Result{ReferralCode: code, Position: 1}, m.err
}
func (m *mockStore) Count(context.Context) (int64, error) { return 7, m.err }
func (m *mockStore) Referral(_ context.Context, code string) (store.Result, error) {
	return store.Result{ReferralCode: code, Position: 2, ReferralCount: 3}, m.err
}
func (m *mockStore) GetSettings(context.Context) (store.SiteSettings, error) {
	return store.DefaultSettings(), m.err
}
func (m *mockStore) UpdateSettings(_ context.Context, _ store.SiteSettings) error {
	return m.err
}
func (m *mockStore) ListSubscribers(_ context.Context, _, _ string) ([]store.SubscriberDetail, error) {
	return []store.SubscriberDetail{
		{Email: "test@example.com", ReferralCode: validRef, Position: 1},
	}, m.err
}
func (m *mockStore) DeleteSubscriber(_ context.Context, _ string) error {
	return m.err
}
func (m *mockStore) SaveCampaign(_ context.Context, _ store.CampaignRecord) error {
	return m.err
}
func (m *mockStore) ListCampaigns(context.Context) ([]store.CampaignRecord, error) {
	return []store.CampaignRecord{}, m.err
}
func (m *mockStore) GetSubscribersForAudience(_ context.Context, _ string) ([]store.SubscriberDetail, error) {
	return []store.SubscriberDetail{
		{Email: "test@example.com", ReferralCode: validRef, Position: 1},
	}, m.err
}

func request(handler http.Handler, method, path, body string) *httptest.ResponseRecorder {
	req := httptest.NewRequest(method, path, strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)
	return rec
}

func TestSignup(t *testing.T) {
	m := &mockStore{}
	h := New(m, "http://localhost:3000")
	rec := request(h, "POST", "/api/waitlist", `{"email":" TEST@example.com ","interest":"game","referredBy":"`+validRef+`"}`)
	if rec.Code != 201 {
		t.Fatalf("status %d: %s", rec.Code, rec.Body.String())
	}
	var result store.Result
	if err := json.Unmarshal(rec.Body.Bytes(), &result); err != nil {
		t.Fatal(err)
	}
	if !validCode(result.ReferralCode) || result.Position != 1 || m.input.Email != "test@example.com" || m.input.Interest != "game" || m.input.ReferredBy == "" {
		t.Fatalf("unexpected result: %+v input: %+v", result, m.input)
	}
}

func TestValidation(t *testing.T) {
	for _, body := range []string{`{}`, `{"email":"bad"}`, `{"email":"Name <a@example.com>"}`, `{"email":"a@example.com","interest":"invalid"}`, `{"email":"a@example.com","referredBy":"bad"}`, `{"email":"a@example.com","extra":true}`, `{"email":"a@example.com"} {}`, `{"email":"` + strings.Repeat("a", 5000) + `@example.com"}`} {
		t.Run(body[:min(len(body), 60)], func(t *testing.T) {
			m := &mockStore{}
			rec := request(New(m, ""), "POST", "/api/waitlist", body)
			if rec.Code != 400 || m.calls != 0 {
				t.Fatalf("status %d, calls %d", rec.Code, m.calls)
			}
		})
	}
}

func TestDuplicateDoesNotExposeToken(t *testing.T) {
	rec := request(New(&mockStore{err: store.ErrDuplicate}, ""), "POST", "/api/waitlist", `{"email":"a@example.com"}`)
	if rec.Code != 409 || strings.Contains(rec.Body.String(), "referralCode") {
		t.Fatalf("unexpected response %s", rec.Body.String())
	}
}

func TestUnavailable(t *testing.T) {
	h := New(&mockStore{err: errors.New("database secret")}, "")
	for _, path := range []string{"/api/waitlist/count", "/api/waitlist/" + validRef} {
		rec := request(h, "GET", path, "")
		if rec.Code != 503 || strings.Contains(rec.Body.String(), "secret") {
			t.Fatal(rec.Body.String())
		}
	}
	rec := request(h, "POST", "/api/waitlist", `{"email":"a@example.com"}`)
	if rec.Code != 503 {
		t.Fatal(rec.Code)
	}
}

func TestCountAndReferral(t *testing.T) {
	h := New(&mockStore{}, "")
	if rec := request(h, "GET", "/api/waitlist/count", ""); rec.Code != 200 || !strings.Contains(rec.Body.String(), `"count":7`) {
		t.Fatal(rec.Body.String())
	}
	if rec := request(h, "GET", "/api/waitlist/"+validRef, ""); rec.Code != 200 || !strings.Contains(rec.Body.String(), `"referralCount":3`) {
		t.Fatal(rec.Body.String())
	}
	if rec := request(h, "GET", "/api/waitlist/bad", ""); rec.Code != 404 {
		t.Fatal(rec.Code)
	}
}

func TestRateLimitAndCors(t *testing.T) {
	h := New(&mockStore{}, "http://localhost:3000")
	for i := 0; i < 10; i++ {
		request(h, "POST", "/api/waitlist", `{"email":"a@example.com"}`)
	}
	if rec := request(h, "POST", "/api/waitlist", `{"email":"a@example.com"}`); rec.Code != 429 {
		t.Fatal(rec.Code)
	}
	for _, origin := range []string{"https://untrusted.example", "http://localhost:3000"} {
		req := httptest.NewRequest("OPTIONS", "/api/waitlist", nil)
		req.Header.Set("Origin", origin)
		rec := httptest.NewRecorder()
		h.ServeHTTP(rec, req)
		if origin == "http://localhost:3000" {
			if rec.Code != 204 || rec.Header().Get("Access-Control-Allow-Origin") != origin {
				t.Fatal(rec.Code)
			}
		} else if rec.Code != 403 {
			t.Fatal(rec.Code)
		}
	}
}

func TestAdminEndpoints(t *testing.T) {
	h := New(&mockStore{}, "http://localhost:3000")

	// Public settings endpoint
	rec := request(h, "GET", "/api/settings", "")
	if rec.Code != 200 {
		t.Fatalf("settings code %d", rec.Code)
	}

	// Unauthorized admin endpoint
	rec = request(h, "GET", "/api/admin/verify", "")
	if rec.Code != 401 {
		t.Fatalf("expected 401, got %d", rec.Code)
	}

	// Authorized admin endpoint
	req := httptest.NewRequest("GET", "/api/admin/verify", nil)
	req.Header.Set("Authorization", "Bearer admin123")
	rec = httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != 200 {
		t.Fatalf("expected 200, got %d", rec.Code)
	}

	// List subscribers
	req = httptest.NewRequest("GET", "/api/admin/subscribers", nil)
	req.Header.Set("Authorization", "Bearer admin123")
	rec = httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != 200 || !strings.Contains(rec.Body.String(), "test@example.com") {
		t.Fatalf("expected subscribers, got %s", rec.Body.String())
	}
}

