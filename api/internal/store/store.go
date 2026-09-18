package store

import (
	"context"
	"encoding/json"
	"errors"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

var ErrDuplicate = errors.New("email already registered")
var ErrNotFound = errors.New("referral not found")

type Input struct {
	Email      string `json:"email"`
	Interest   string `json:"interest,omitempty"`
	ReferredBy string `json:"referredBy,omitempty"`
}

type Result struct {
	ReferralCode  string `json:"referralCode"`
	Position      int64  `json:"position"`
	ReferralCount int64  `json:"referralCount"`
}

type SocialLink struct {
	Enabled bool   `json:"enabled"`
	URL     string `json:"url"`
}

type SiteSettings struct {
	ShowWaitlistCount bool                  `json:"showWaitlistCount"`
	SocialLinks       map[string]SocialLink `json:"socialLinks"`
}

type CampaignRecord struct {
	ID             string    `json:"id"`
	Subject        string    `json:"subject"`
	Content        string    `json:"content"`
	TargetAudience string    `json:"targetAudience"`
	RecipientCount int       `json:"recipientCount"`
	Status         string    `json:"status"`
	SentAt         time.Time `json:"sentAt"`
}

type SubscriberDetail struct {
	ID            string    `json:"id"`
	Email         string    `json:"email"`
	Interest      *string   `json:"interest"`
	ReferralCode  string    `json:"referralCode"`
	ReferredBy    *string   `json:"referredBy"`
	ReferralCount int64     `json:"referralCount"`
	Position      int64     `json:"position"`
	CreatedAt     time.Time `json:"createdAt"`
}

type Store interface {
	Create(context.Context, Input, string, string) (Result, error)
	Count(context.Context) (int64, error)
	Referral(context.Context, string) (Result, error)
	GetSettings(context.Context) (SiteSettings, error)
	UpdateSettings(context.Context, SiteSettings) error
	ListSubscribers(context.Context, string, string) ([]SubscriberDetail, error)
	DeleteSubscriber(context.Context, string) error
	SaveCampaign(context.Context, CampaignRecord) error
	ListCampaigns(context.Context) ([]CampaignRecord, error)
	GetSubscribersForAudience(context.Context, string) ([]SubscriberDetail, error)
}

type Postgres struct{ Pool *pgxpool.Pool }

const ranking = `WITH scores AS (
 SELECT s."referralCode", s."createdAt", s.id, count(r.id) AS referrals
 FROM "WaitlistSignup" s LEFT JOIN "WaitlistSignup" r ON r."referredBy" = s."referralCode"
 GROUP BY s.id
), ranked AS (
 SELECT "referralCode", referrals, row_number() OVER (ORDER BY referrals DESC, "createdAt", id) AS position FROM scores
) SELECT "referralCode", position, referrals FROM ranked WHERE "referralCode" = $1`

func (p *Postgres) Create(ctx context.Context, in Input, id string, code string) (Result, error) {
	tx, err := p.Pool.Begin(ctx)
	if err != nil {
		return Result{}, err
	}
	defer tx.Rollback(ctx)
	_, err = tx.Exec(ctx, `INSERT INTO "WaitlistSignup" (id, email, interest, "referralCode", "referredBy") VALUES ($1, $2, NULLIF($3, ''), $4, (SELECT "referralCode" FROM "WaitlistSignup" WHERE "referralCode" = $5))`, id, in.Email, in.Interest, code, in.ReferredBy)
	if err != nil {
		var pe *pgconn.PgError
		if errors.As(err, &pe) && pe.Code == "23505" && pe.ConstraintName == "WaitlistSignup_email_key" {
			return Result{}, ErrDuplicate
		}
		return Result{}, err
	}
	var result Result
	err = tx.QueryRow(ctx, ranking, code).Scan(&result.ReferralCode, &result.Position, &result.ReferralCount)
	if err != nil {
		return Result{}, err
	}
	if err = tx.Commit(ctx); err != nil {
		return Result{}, err
	}
	return result, nil
}

func (p *Postgres) Count(ctx context.Context) (int64, error) {
	var count int64
	err := p.Pool.QueryRow(ctx, `SELECT count(*) FROM "WaitlistSignup"`).Scan(&count)
	return count, err
}

func (p *Postgres) Referral(ctx context.Context, code string) (Result, error) {
	var result Result
	err := p.Pool.QueryRow(ctx, ranking, code).Scan(&result.ReferralCode, &result.Position, &result.ReferralCount)
	if errors.Is(err, pgx.ErrNoRows) {
		return Result{}, ErrNotFound
	}
	return result, err
}

type Export struct {
	Email         string
	Interest      *string
	ReferralCode  string
	ReferredBy    *string
	ReferralCount int64
	Position      int64
	CreatedAt     time.Time
}

func NewPool(ctx context.Context, url string) (*pgxpool.Pool, error) {
	cfg, err := pgxpool.ParseConfig(url)
	if err != nil {
		return nil, err
	}
	cfg.MaxConns = 8
	cfg.MinConns = 1
	cfg.MaxConnLifetime = time.Hour
	cfg.MaxConnIdleTime = 15 * time.Minute
	return pgxpool.NewWithConfig(ctx, cfg)
}

func New(pool *pgxpool.Pool) Store {
	return &Postgres{Pool: pool}
}

func ListAll(ctx context.Context, pool *pgxpool.Pool) ([]Export, error) {
	rows, err := pool.Query(ctx, `WITH scores AS (
	 SELECT s."email", s."interest", s."referralCode", s."referredBy", s."createdAt", s.id, count(r.id) AS referrals
	 FROM "WaitlistSignup" s LEFT JOIN "WaitlistSignup" r ON r."referredBy" = s."referralCode"
	 GROUP BY s.id
	), ranked AS (
	 SELECT "email", "interest", "referralCode", "referredBy", "createdAt", referrals, row_number() OVER (ORDER BY referrals DESC, "createdAt", id) AS position FROM scores
	) SELECT "email", "interest", "referralCode", "referredBy", "createdAt", referrals, position FROM ranked ORDER BY position`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []Export
	for rows.Next() {
		var row Export
		if err := rows.Scan(&row.Email, &row.Interest, &row.ReferralCode, &row.ReferredBy, &row.CreatedAt, &row.ReferralCount, &row.Position); err != nil {
			return nil, err
		}
		out = append(out, row)
	}
	return out, rows.Err()
}

func DefaultSettings() SiteSettings {
	return SiteSettings{
		ShowWaitlistCount: true,
		SocialLinks: map[string]SocialLink{
			"twitter":   {Enabled: false, URL: ""},
			"instagram": {Enabled: false, URL: ""},
			"youtube":   {Enabled: false, URL: ""},
			"discord":   {Enabled: false, URL: ""},
			"tiktok":    {Enabled: false, URL: ""},
			"github":    {Enabled: false, URL: ""},
			"linkedin":  {Enabled: false, URL: ""},
		},
	}
}

func (p *Postgres) GetSettings(ctx context.Context) (SiteSettings, error) {
	var showCount bool
	var linksData []byte
	err := p.Pool.QueryRow(ctx, `SELECT "showWaitlistCount", "socialLinks" FROM "SiteSetting" WHERE "id" = 'default'`).Scan(&showCount, &linksData)
	if errors.Is(err, pgx.ErrNoRows) {
		return DefaultSettings(), nil
	}
	if err != nil {
		return DefaultSettings(), err
	}
	links := make(map[string]SocialLink)
	if len(linksData) > 0 {
		_ = json.Unmarshal(linksData, &links)
	}
	defaults := DefaultSettings()
	for k, v := range defaults.SocialLinks {
		if _, exists := links[k]; !exists {
			links[k] = v
		}
	}
	return SiteSettings{
		ShowWaitlistCount: showCount,
		SocialLinks:       links,
	}, nil
}

func (p *Postgres) UpdateSettings(ctx context.Context, s SiteSettings) error {
	linksData, err := json.Marshal(s.SocialLinks)
	if err != nil {
		return err
	}
	_, err = p.Pool.Exec(ctx, `
		INSERT INTO "SiteSetting" ("id", "showWaitlistCount", "socialLinks", "updatedAt")
		VALUES ('default', $1, $2, CURRENT_TIMESTAMP)
		ON CONFLICT ("id") DO UPDATE
		SET "showWaitlistCount" = EXCLUDED."showWaitlistCount",
		    "socialLinks" = EXCLUDED."socialLinks",
		    "updatedAt" = CURRENT_TIMESTAMP
	`, s.ShowWaitlistCount, linksData)
	return err
}

func (p *Postgres) ListSubscribers(ctx context.Context, search, interest string) ([]SubscriberDetail, error) {
	search = strings.TrimSpace(search)
	interest = strings.TrimSpace(interest)
	rows, err := p.Pool.Query(ctx, `WITH scores AS (
		SELECT s.id, s."email", s."interest", s."referralCode", s."referredBy", s."createdAt", count(r.id) AS referrals
		FROM "WaitlistSignup" s LEFT JOIN "WaitlistSignup" r ON r."referredBy" = s."referralCode"
		GROUP BY s.id
	), ranked AS (
		SELECT id, "email", "interest", "referralCode", "referredBy", "createdAt", referrals,
		       row_number() OVER (ORDER BY referrals DESC, "createdAt", id) AS position
		FROM scores
	)
	SELECT id, "email", "interest", "referralCode", "referredBy", "createdAt", referrals, position
	FROM ranked
	WHERE ($1 = '' OR "email" ILIKE '%' || $1 || '%' OR "referralCode" ILIKE '%' || $1 || '%')
	  AND ($2 = '' OR "interest" = $2)
	ORDER BY position`, search, interest)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []SubscriberDetail
	for rows.Next() {
		var row SubscriberDetail
		var id string
		if err := rows.Scan(&id, &row.Email, &row.Interest, &row.ReferralCode, &row.ReferredBy, &row.CreatedAt, &row.ReferralCount, &row.Position); err != nil {
			return nil, err
		}
		row.ID = id
		out = append(out, row)
	}
	return out, rows.Err()
}

func (p *Postgres) DeleteSubscriber(ctx context.Context, idOrEmail string) error {
	tx, err := p.Pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	var code string
	_ = tx.QueryRow(ctx, `SELECT "referralCode" FROM "WaitlistSignup" WHERE id::text = $1 OR "referralCode" = $1 OR "email" = $1`, idOrEmail).Scan(&code)
	if code != "" {
		_, _ = tx.Exec(ctx, `UPDATE "WaitlistSignup" SET "referredBy" = NULL WHERE "referredBy" = $1`, code)
	}

	cmdTag, err := tx.Exec(ctx, `DELETE FROM "WaitlistSignup" WHERE id::text = $1 OR "referralCode" = $1 OR "email" = $1`, idOrEmail)
	if err != nil {
		return err
	}
	if cmdTag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return tx.Commit(ctx)
}

func (p *Postgres) SaveCampaign(ctx context.Context, c CampaignRecord) error {
	_, err := p.Pool.Exec(ctx, `
		INSERT INTO "EmailCampaign" ("id", "subject", "content", "targetAudience", "recipientCount", "status", "sentAt")
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`, c.ID, c.Subject, c.Content, c.TargetAudience, c.RecipientCount, c.Status, c.SentAt)
	return err
}

func (p *Postgres) ListCampaigns(ctx context.Context) ([]CampaignRecord, error) {
	rows, err := p.Pool.Query(ctx, `
		SELECT "id", "subject", "content", "targetAudience", "recipientCount", "status", "sentAt"
		FROM "EmailCampaign"
		ORDER BY "sentAt" DESC
		LIMIT 100
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []CampaignRecord
	for rows.Next() {
		var c CampaignRecord
		if err := rows.Scan(&c.ID, &c.Subject, &c.Content, &c.TargetAudience, &c.RecipientCount, &c.Status, &c.SentAt); err != nil {
			return nil, err
		}
		out = append(out, c)
	}
	return out, rows.Err()
}

func (p *Postgres) GetSubscribersForAudience(ctx context.Context, audience string) ([]SubscriberDetail, error) {
	var interestFilter string
	if audience != "" && audience != "all" {
		interestFilter = audience
	}
	return p.ListSubscribers(ctx, "", interestFilter)
}
