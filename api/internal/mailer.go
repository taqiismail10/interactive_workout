package api

import (
	"context"
	"fmt"
	"net/smtp"
	"os"
	"strconv"
	"strings"

	"interactiveworkout/api/internal/store"
)

type MailerConfig struct {
	Host string
	Port int
	User string
	Pass string
	From string
}

func getMailerConfig() MailerConfig {
	port, _ := strconv.Atoi(os.Getenv("SMTP_PORT"))
	if port == 0 {
		port = 587
	}
	from := os.Getenv("SMTP_FROM")
	if from == "" {
		from = "InteractiveWorkout <noreply@interactiveworkout.game>"
	}
	return MailerConfig{
		Host: os.Getenv("SMTP_HOST"),
		Port: port,
		User: os.Getenv("SMTP_USER"),
		Pass: os.Getenv("SMTP_PASS"),
		From: from,
	}
}

func renderTemplate(body string, origin string, sub store.SubscriberDetail) string {
	refUrl := fmt.Sprintf("%s/?ref=%s", strings.TrimRight(origin, "/"), sub.ReferralCode)
	r := strings.NewReplacer(
		"{{email}}", sub.Email,
		"{{referralCode}}", sub.ReferralCode,
		"{{referralUrl}}", refUrl,
		"{{position}}", fmt.Sprintf("%d", sub.Position),
	)
	return r.Replace(body)
}

func sendSingleEmail(cfg MailerConfig, to string, subject string, htmlOrTextBody string) error {
	if cfg.Host == "" {
		// Simulation mode
		fmt.Printf("[SIMULATED EMAIL] To: %s | Subject: %s\n", to, subject)
		return nil
	}

	auth := smtp.PlainAuth("", cfg.User, cfg.Pass, cfg.Host)
	addr := fmt.Sprintf("%s:%d", cfg.Host, cfg.Port)

	isHTML := strings.Contains(htmlOrTextBody, "<html") || strings.Contains(htmlOrTextBody, "<div") || strings.Contains(htmlOrTextBody, "<p")
	contentType := "text/plain; charset=UTF-8"
	if isHTML {
		contentType = "text/html; charset=UTF-8"
	}

	msg := []byte(fmt.Sprintf("From: %s\r\nTo: %s\r\nSubject: %s\r\nMIME-Version: 1.0\r\nContent-Type: %s\r\n\r\n%s",
		cfg.From, to, subject, contentType, htmlOrTextBody))

	return smtp.SendMail(addr, auth, cfg.From, []string{to}, msg)
}

func SendCampaign(ctx context.Context, origin string, subject, content string, recipients []store.SubscriberDetail) (int, string, error) {
	cfg := getMailerConfig()
	sentCount := 0
	isSimulated := cfg.Host == ""

	for _, sub := range recipients {
		select {
		case <-ctx.Done():
			return sentCount, "interrupted", ctx.Err()
		default:
		}

		renderedContent := renderTemplate(content, origin, sub)
		renderedSubject := renderTemplate(subject, origin, sub)

		if err := sendSingleEmail(cfg, sub.Email, renderedSubject, renderedContent); err != nil {
			fmt.Fprintf(os.Stderr, "failed to send email to %s: %v\n", sub.Email, err)
			continue
		}
		sentCount++
	}

	status := "sent"
	if isSimulated {
		status = "simulated"
	}
	return sentCount, status, nil
}

func SendTestEmail(ctx context.Context, origin string, testEmail, subject, content string) (string, error) {
	cfg := getMailerConfig()
	isSimulated := cfg.Host == ""

	mockSub := store.SubscriberDetail{
		Email:         testEmail,
		ReferralCode:  "PREVIEW_TEST_CODE_12345",
		Position:      42,
		ReferralCount: 5,
	}

	renderedContent := renderTemplate(content, origin, mockSub)
	renderedSubject := renderTemplate(subject, origin, mockSub)

	err := sendSingleEmail(cfg, testEmail, renderedSubject, renderedContent)
	if err != nil {
		return "failed", err
	}
	if isSimulated {
		return "simulated", nil
	}
	return "sent", nil
}
