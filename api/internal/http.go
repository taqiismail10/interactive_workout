package api

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net"
	"net/http"
	"net/mail"
	"os"
	"strings"
	"sync"
	"time"

	"interactiveworkout/api/internal/store"
)

type bucket struct {
	start time.Time
	count int
}
type Server struct {
	store  store.Store
	origin string
	mu     sync.Mutex
	limits map[string]bucket
}

func isOriginAllowed(origin string, allowedOrigin string) bool {
	if origin == "" {
		return true
	}
	if allowedOrigin == "*" {
		return true
	}
	for _, o := range strings.Split(allowedOrigin, ",") {
		o = strings.TrimSpace(o)
		if o != "" && origin == o {
			return true
		}
	}
	// In local dev when allowedOrigin is a localhost or 127.0.0.1 address,
	// allow local dev ports (e.g. Next.js on 3000 or 3001, 127.0.0.1)
	isLocalDev := strings.HasPrefix(allowedOrigin, "http://localhost") || strings.HasPrefix(allowedOrigin, "http://127.0.0.1")
	if isLocalDev {
		if strings.HasPrefix(origin, "http://localhost:") || origin == "http://localhost" ||
			strings.HasPrefix(origin, "http://127.0.0.1:") || origin == "http://127.0.0.1" {
			return true
		}
	}
	return false
}

func New(s store.Store, origin string) http.Handler {
	server := &Server{store: s, origin: origin, limits: make(map[string]bucket)}
	mux := http.NewServeMux()
	mux.HandleFunc("POST /api/waitlist", server.signup)
	mux.HandleFunc("GET /api/waitlist/count", server.count)
	mux.HandleFunc("GET /api/waitlist/{code}", server.referral)
	mux.HandleFunc("GET /api/settings", server.getSettings)
	mux.HandleFunc("GET /api/admin/verify", server.requireAdmin(server.adminVerify))
	mux.HandleFunc("GET /api/admin/settings", server.requireAdmin(server.getSettings))
	mux.HandleFunc("PUT /api/admin/settings", server.requireAdmin(server.updateSettings))
	mux.HandleFunc("GET /api/admin/subscribers", server.requireAdmin(server.listSubscribers))
	mux.HandleFunc("DELETE /api/admin/subscribers/{id}", server.requireAdmin(server.deleteSubscriber))
	mux.HandleFunc("POST /api/admin/send-email", server.requireAdmin(server.sendEmail))
	mux.HandleFunc("GET /api/admin/campaigns", server.requireAdmin(server.listCampaigns))

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Cache-Control", "no-store")
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("Vary", "Origin")
		if origin := r.Header.Get("Origin"); origin != "" {
			if !isOriginAllowed(origin, server.origin) {
				respond(w, 403, map[string]string{"error": "Origin not allowed."})
				return
			}
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Admin-Secret")
		}
		if r.Method == http.MethodOptions {
			w.WriteHeader(204)
			return
		}
		ctx, cancel := context.WithTimeout(r.Context(), 30*time.Second)
		defer cancel()
		mux.ServeHTTP(w, r.WithContext(ctx))
	})
}

func respond(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func (s *Server) allowed(address string) bool {
	host, _, err := net.SplitHostPort(address)
	if err != nil {
		host = address
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	now := time.Now()
	for ip, b := range s.limits {
		if now.Sub(b.start) >= time.Minute {
			delete(s.limits, ip)
		}
	}
	b, exists := s.limits[host]
	if !exists {
		if len(s.limits) >= 10000 {
			return false
		}
		b.start = now
	}
	b.count++
	s.limits[host] = b
	return b.count <= 10
}

func (s *Server) signup(w http.ResponseWriter, r *http.Request) {
	if !s.allowed(r.RemoteAddr) {
		w.Header().Set("Retry-After", "60")
		respond(w, 429, map[string]string{"error": "Please try again in a minute."})
		return
	}
	if strings.Split(r.Header.Get("Content-Type"), ";")[0] != "application/json" {
		respond(w, 415, map[string]string{"error": "Send JSON data."})
		return
	}
	var input store.Input
	decoder := json.NewDecoder(http.MaxBytesReader(w, r.Body, 4096))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&input); err != nil {
		respond(w, 400, map[string]string{"error": "Invalid signup data."})
		return
	}
	if err := decoder.Decode(new(any)); err != io.EOF {
		respond(w, 400, map[string]string{"error": "Invalid signup data."})
		return
	}
	input.Email = strings.ToLower(strings.TrimSpace(input.Email))
	address, err := mail.ParseAddress(input.Email)
	if err != nil || address.Address != input.Email || len(input.Email) > 254 || !strings.Contains(strings.Split(input.Email, "@")[len(strings.Split(input.Email, "@"))-1], ".") {
		respond(w, 400, map[string]string{"error": "Enter a valid email address."})
		return
	}
	switch input.Interest {
	case "", "game", "fitness", "curious":
	default:
		respond(w, 400, map[string]string{"error": "Choose a valid interest."})
		return
	}
	if input.ReferredBy != "" && !validCode(input.ReferredBy) {
		respond(w, 400, map[string]string{"error": "Invalid referral code."})
		return
	}
	// Generate UUID v4 for the row primary key.
	var idBytes [16]byte
	if _, err := rand.Read(idBytes[:]); err != nil {
		respond(w, 500, map[string]string{"error": "Please try again later."})
		return
	}
	// Set version 4 and variant bits (RFC 4122).
	idBytes[6] = (idBytes[6] & 0x0f) | 0x40
	idBytes[8] = (idBytes[8] & 0x3f) | 0x80
	id := fmt.Sprintf("%08x-%04x-%04x-%04x-%012x",
		idBytes[0:4], idBytes[4:6], idBytes[6:8], idBytes[8:10], idBytes[10:16])

	// Generate a 24-char URL-safe base64 referral code (18 random bytes).
	var codeBytes [18]byte
	if _, err := rand.Read(codeBytes[:]); err != nil {
		respond(w, 500, map[string]string{"error": "Please try again later."})
		return
	}
	referralCode := base64.RawURLEncoding.EncodeToString(codeBytes[:])

	result, err := s.store.Create(r.Context(), input, id, referralCode)
	if errors.Is(err, store.ErrDuplicate) {
		respond(w, 409, map[string]string{"error": "This email is already on the list. Use your saved referral link to check your spot."})
		return
	}
	if err != nil {
		respond(w, 503, map[string]string{"error": "Signups are temporarily unavailable. Please try again."})
		return
	}
	respond(w, 201, result)
}

func validCode(code string) bool {
	// 24-char URL-safe base64 (no padding) — matches VARCHAR(24) + DB check constraint.
	if len(code) != 24 {
		return false
	}
	for _, c := range code {
		if !((c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z') || (c >= '0' && c <= '9') || c == '-' || c == '_') {
			return false
		}
	}
	return true
}

func (s *Server) count(w http.ResponseWriter, r *http.Request) {
	count, err := s.store.Count(r.Context())
	if err != nil {
		respond(w, 503, map[string]string{"error": "Count unavailable."})
		return
	}
	respond(w, 200, map[string]int64{"count": count})
}

func (s *Server) referral(w http.ResponseWriter, r *http.Request) {
	code := r.PathValue("code")
	if !validCode(code) {
		respond(w, 404, map[string]string{"error": "Referral not found."})
		return
	}
	result, err := s.store.Referral(r.Context(), code)
	if errors.Is(err, store.ErrNotFound) {
		respond(w, 404, map[string]string{"error": "Referral not found."})
		return
	}
	if err != nil {
		respond(w, 503, map[string]string{"error": "Referral status unavailable."})
		return
	}
	respond(w, 200, result)
}

func (s *Server) requireAdmin(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		expected := os.Getenv("ADMIN_SECRET")
		if expected == "" {
			expected = "admin123"
		}

		authHeader := r.Header.Get("Authorization")
		token := ""
		if strings.HasPrefix(authHeader, "Bearer ") {
			token = strings.TrimPrefix(authHeader, "Bearer ")
		} else if authHeader != "" {
			token = authHeader
		} else {
			token = r.Header.Get("X-Admin-Secret")
		}

		if token == "" || token != expected {
			respond(w, 401, map[string]string{"error": "Unauthorized. Invalid admin secret."})
			return
		}

		next(w, r)
	}
}

func (s *Server) adminVerify(w http.ResponseWriter, r *http.Request) {
	respond(w, 200, map[string]any{"ok": true})
}

func (s *Server) getSettings(w http.ResponseWriter, r *http.Request) {
	settings, err := s.store.GetSettings(r.Context())
	if err != nil {
		respond(w, 500, map[string]string{"error": "Failed to fetch settings."})
		return
	}
	respond(w, 200, settings)
}

func (s *Server) updateSettings(w http.ResponseWriter, r *http.Request) {
	var settings store.SiteSettings
	if err := json.NewDecoder(r.Body).Decode(&settings); err != nil {
		respond(w, 400, map[string]string{"error": "Invalid settings payload."})
		return
	}
	if err := s.store.UpdateSettings(r.Context(), settings); err != nil {
		respond(w, 500, map[string]string{"error": "Failed to update settings."})
		return
	}
	respond(w, 200, settings)
}

func (s *Server) listSubscribers(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query().Get("q")
	interest := r.URL.Query().Get("interest")
	subs, err := s.store.ListSubscribers(r.Context(), q, interest)
	if err != nil {
		respond(w, 500, map[string]string{"error": "Failed to list subscribers."})
		return
	}
	if subs == nil {
		subs = []store.SubscriberDetail{}
	}
	respond(w, 200, map[string]any{"subscribers": subs, "count": len(subs)})
}

func (s *Server) deleteSubscriber(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		respond(w, 400, map[string]string{"error": "Subscriber ID required."})
		return
	}
	err := s.store.DeleteSubscriber(r.Context(), id)
	if errors.Is(err, store.ErrNotFound) {
		respond(w, 404, map[string]string{"error": "Subscriber not found."})
		return
	}
	if err != nil {
		respond(w, 500, map[string]string{"error": "Failed to delete subscriber."})
		return
	}
	respond(w, 200, map[string]any{"ok": true})
}

type SendEmailPayload struct {
	Subject        string `json:"subject"`
	Content        string `json:"content"`
	TargetAudience string `json:"targetAudience"`
	IsTest         bool   `json:"isTest"`
	TestEmail      string `json:"testEmail"`
}

func (s *Server) sendEmail(w http.ResponseWriter, r *http.Request) {
	var req SendEmailPayload
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respond(w, 400, map[string]string{"error": "Invalid email request payload."})
		return
	}
	req.Subject = strings.TrimSpace(req.Subject)
	req.Content = strings.TrimSpace(req.Content)
	if req.Subject == "" || req.Content == "" {
		respond(w, 400, map[string]string{"error": "Subject and content are required."})
		return
	}

	if req.IsTest {
		req.TestEmail = strings.ToLower(strings.TrimSpace(req.TestEmail))
		if req.TestEmail == "" {
			respond(w, 400, map[string]string{"error": "Test email address is required."})
			return
		}
		status, err := SendTestEmail(r.Context(), s.origin, req.TestEmail, req.Subject, req.Content)
		if err != nil {
			respond(w, 500, map[string]string{"error": fmt.Sprintf("Failed to send test email: %v", err)})
			return
		}
		respond(w, 200, map[string]any{
			"status":         status,
			"recipientCount": 1,
			"isTest":         true,
		})
		return
	}

	audience := req.TargetAudience
	if audience == "" {
		audience = "all"
	}
	subs, err := s.store.GetSubscribersForAudience(r.Context(), audience)
	if err != nil {
		respond(w, 500, map[string]string{"error": "Failed to retrieve subscribers."})
		return
	}

	sentCount, status, err := SendCampaign(r.Context(), s.origin, req.Subject, req.Content, subs)
	if err != nil {
		respond(w, 500, map[string]string{"error": fmt.Sprintf("Email campaign error: %v", err)})
		return
	}

	// Save campaign record
	var idBytes [16]byte
	_, _ = rand.Read(idBytes[:])
	idBytes[6] = (idBytes[6] & 0x0f) | 0x40
	idBytes[8] = (idBytes[8] & 0x3f) | 0x80
	campaignID := fmt.Sprintf("%08x-%04x-%04x-%04x-%012x",
		idBytes[0:4], idBytes[4:6], idBytes[6:8], idBytes[8:10], idBytes[10:16])

	_ = s.store.SaveCampaign(r.Context(), store.CampaignRecord{
		ID:             campaignID,
		Subject:        req.Subject,
		Content:        req.Content,
		TargetAudience: audience,
		RecipientCount: sentCount,
		Status:         status,
		SentAt:         time.Now().UTC(),
	})

	respond(w, 200, map[string]any{
		"status":         status,
		"recipientCount": sentCount,
		"isTest":         false,
	})
}

func (s *Server) listCampaigns(w http.ResponseWriter, r *http.Request) {
	campaigns, err := s.store.ListCampaigns(r.Context())
	if err != nil {
		respond(w, 500, map[string]string{"error": "Failed to fetch campaigns."})
		return
	}
	if campaigns == nil {
		campaigns = []store.CampaignRecord{}
	}
	respond(w, 200, map[string]any{"campaigns": campaigns})
}

