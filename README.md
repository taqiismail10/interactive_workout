# InteractiveWorkout — Waitlist Site

Single-page pre-launch waitlist site: Next.js (App Router) frontend + Go API + PostgreSQL. Signups get a referral code, live position, and share buttons; a live counter and CSV export round it out.

## Layout

```
web/   Next.js 16 + Tailwind 4 frontend (port 3000)
api/   Go REST API (port 8080)
db/    Prisma schema + SQL migration (Postgres)
```

## Run locally

1. Start Postgres (any way you like):

   ```bash
   docker compose up db -d
   ```

2. Apply the migration:

   ```bash
   cd db && npm install && npx prisma migrate deploy
   ```

3. Run the API (new terminal):

   ```bash
   cd api && go run ./cmd/server
   ```

4. Run the frontend (new terminal):

   ```bash
   cd web && npm install && npm run dev
   ```

Open http://localhost:3000.

Everything in one command instead: `docker compose up --build` (builds web + api + runs migration).

## Environment

| Variable | Where | Default | Purpose |
| --- | --- | --- | --- |
| `DATABASE_URL` | api, db | — | Postgres connection string |
| `ORIGIN` | api | `http://localhost:3000` | Allowed CORS origin |
| `ADDR` | api | `:8080` | Listen address |
| `NEXT_PUBLIC_API_URL` | web | `http://localhost:8080` | API base URL baked into the client |

## API

- `POST /api/waitlist` — `{ email, interest?, referredBy? }` → `{ referralCode, position, referralCount }`. Duplicate emails get a generic 409 (no token leak). Rate limited per IP.
- `GET /api/waitlist/count` — `{ count }`
- `GET /api/waitlist/:referralCode` — `{ referralCode, position, referralCount }`

Position = referral count first, then earliest signup. Referring bumps you up.

## Export the list (CSV)

```bash
cd api && go run ./cmd/export -out waitlist.csv
```

Columns: email, interest, referralCode, referredBy, referralCount, position, createdAt.

## Tests / checks

```bash
cd api && go test ./... && go vet ./...
cd web && npm run build && npm run lint
cd db && npm run validate
```

## Notes

- Referral flow: after signup the user gets `?ref=<code>` link; new signups arriving with `?ref=` are attributed and stored in localStorage so refreshes keep attribution.
- `prefers-reduced-motion` disables all animation (lanes, confetti, tilt, reveals).
- No fake scarcity, no accounts, no payments — per the PRD.
