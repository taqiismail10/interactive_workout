# Build Log — InteractiveWorkout Waitlist Site
Date: 2026-09-17 | Agent: opencode (union-alpha) | Status: complete — unit + e2e DB tests passing (2026-09-18)

## E2E verification (2026-09-18)
- Postgres healthy via docker compose; `prisma migrate deploy` → no pending migrations.
- `go test ./...` + `go vet ./...` → pass.
- Live API on :8080 verified: signup (201, code+position), referral lookup, referral attribution
  (referrer position 3→1 after 1 referral), duplicate email → generic 409, invalid email → 400,
- count endpoint reflects inserts (5 rows incl. earlier dev rows).
