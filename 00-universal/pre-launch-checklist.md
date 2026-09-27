# Pre-launch checklist (every project)

## P0 — Do not ship without these
- [ ] No secrets in repo or git history (`git log -p | grep -i "api_key\|secret\|password"`)
- [ ] No secrets in client bundles (frontend, mobile)
- [ ] Auth + authorization tested with 2 different users
- [ ] Server-side input validation on every write endpoint
- [ ] Parameterized DB queries only
- [ ] HTTPS enforced
- [ ] Production env variables set; debug mode off
- [ ] DB backup exists and a restore was tested once
- [ ] Error tracking connected (Sentry or similar)
- [ ] Privacy policy + terms published (if you collect personal data)

## P1 — First week
- [ ] Rate limiting on auth and expensive endpoints
- [ ] Uptime monitoring
- [ ] Pagination on every list
- [ ] Load test with 10x your expected traffic
- [ ] Core flows covered by at least one E2E test (signup, login, main action, payment)
- [ ] 404 / 500 pages exist

## P2 — Improvements
- [ ] Lighthouse / accessibility score reviewed
- [ ] Analytics events on the main funnel
- [ ] Dependency audit (`npm audit`, `dotnet list package --vulnerable`, etc.)
