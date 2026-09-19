# Contributing to InteractiveWorkout

Thanks for your interest! This is a small, focused repo — a single waitlist page plus its signup backend. Small, scoped pull requests are the norm here.

Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before participating.

## Good first issues

New here? Look for issues labeled `good first issue`. Copy tweaks, accessibility fixes, and test coverage are always welcome.

## How to run it

Everything you need is in the [README](README.md). Quick path:

```bash
docker compose up --build   # web :3000, api :8080, postgres :5432
```

Or service by service: Postgres via Compose, `npx prisma migrate deploy` in `db/`, `go run ./cmd/server` in `api/`, `npm install && npm run dev` in `web/`.

## Before you push

Run the checks for every area you touched:

```bash
cd api && go test ./... && go vet ./...
cd web && npm run build && npm run lint
cd db && npm run validate
```

## Pull request guidance

- **Branch off `main`** with a descriptive name (`fix/…`, `feat/…`, `chore/…`) — don't push straight to `main`.
- **Keep it small and scoped.** This page is a days-not-weeks surface; don't add frameworks, analytics stacks, or product features (no accounts, gameplay, payments — see the PRD's out-of-scope list).
- **Describe the why**, link any related issue, and include before/after screenshots for visual changes (desktop + mobile widths).
- **Respect the architecture:** thin client, validation and ranking server-side, typed errors end-to-end. Don't move business logic into the UI.
- **Accessibility matters here:** label form controls, keep touch targets ≥ 44px, preserve visible focus, and keep `prefers-reduced-motion` working.
- **Don't commit secrets or local noise:** `.env` files, `node_modules`, `.next`, `*.mp4`, and scratch assets are gitignored — if `git status` shows something unexpected, check `.gitignore` before adding.

## Reporting bugs

Open an issue with: what you expected, what happened, steps to reproduce, and your environment (OS, browser, Node/Go versions). Screenshots help.

## Security

Found a vulnerability? **Do not open a public issue.** Email hello@interactiveworkout.game with details instead.
