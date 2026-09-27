# Pre-launch checklist (every project)

## P0 — Do not ship without these
- [ ] `PRE-001` No secrets in repo or git history (`gitleaks detect --redact`)
- [ ] `PRE-002` No secrets in client bundles (frontend, mobile)
- [ ] `PRE-003` Auth + authorization tested with 2 different users
- [ ] `PRE-004` Server-side input validation on every write endpoint
- [ ] `PRE-005` Parameterized DB queries only
- [ ] `PRE-006` HTTPS enforced
- [ ] `PRE-007` Production env variables set; debug mode off
- [ ] `PRE-008` DB backup exists and a restore was tested once
- [ ] `PRE-009` Error tracking connected (Sentry or similar)
- [ ] `PRE-010` Privacy policy + terms published (if you collect personal data)

## P1 — First week
- [ ] `PRE-011` Rate limiting on auth and expensive endpoints
- [ ] `PRE-012` Uptime monitoring
- [ ] `PRE-013` Pagination on every list
- [ ] `PRE-014` Load test with 10x your expected traffic
- [ ] `PRE-015` Core flows covered by at least one E2E test (signup, login, main action, payment)
- [ ] `PRE-016` 404 / 500 pages exist

## P2 — Improvements
- [ ] `PRE-017` Lighthouse / accessibility score reviewed
- [ ] `PRE-018` Analytics events on the main funnel
- [ ] `PRE-019` Dependency audit (`npm audit`, `dotnet list package --vulnerable`, etc.)
