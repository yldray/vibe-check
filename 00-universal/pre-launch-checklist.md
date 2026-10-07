# Pre-launch checklist (every project)

One-page summary. `→` points to the full check: same check, same severity.

## P0 — Do not ship without these
- [ ] `PRE-001` No secrets in repo or git history (`gitleaks detect --redact`) → `UNI-001`
- [ ] `PRE-002` No secrets in client bundles (frontend, mobile) → `FE-001` `MOB-001`
- [ ] `PRE-003` Auth + authorization tested with 2 different users → `UNI-004` `SEC-003`
- [ ] `PRE-004` Server-side input validation on every write endpoint → `UNI-005`
- [ ] `PRE-005` Parameterized DB queries only → `SEC-004`
- [ ] `PRE-006` HTTPS enforced → `WEB-001`
- [ ] `PRE-007` Production env variables set; debug mode off → `ENV-004` `WEB-002`
- [ ] `PRE-008` DB backup exists and a restore was tested once → `WEB-003`
- [ ] `PRE-009` Error tracking connected (Sentry or similar) → `WEB-004` `MOB-004`
- [ ] `PRE-010` Privacy policy + terms published (if you collect personal data) → `LEGAL-001` `LEGAL-003`
- [ ] `PRE-020` App refuses to start with a missing, placeholder or dev-default setting → `ENV-005`
- [ ] `PRE-021` No login backdoors, codes in responses or seed accounts in production → `AUTH-009`
- [ ] `PRE-022` Every production host runs the commit you pushed → `OPS-015`
- [ ] `PRE-023` New and changed SQL ran once on production-shaped schema and data → `UNI-017`

## P1 — First week
- [ ] `PRE-011` Rate limiting on auth and expensive endpoints → `SEC-007`
- [ ] `PRE-012` Uptime monitoring → `WEB-006`
- [ ] `PRE-013` Pagination on every list → `UNI-010`
- [ ] `PRE-014` Load test with 10x your expected traffic → `PERF-005`
- [ ] `PRE-015` Core flows covered by at least one E2E test (signup, login, main action, payment)
- [ ] `PRE-016` 404 / 500 pages exist → `WEB-011`
- [ ] `PRE-019` Dependency audit (`npm audit`, `dotnet list package --vulnerable`, etc.) → `SEC-010`
- [ ] `PRE-024` Search engines can index the site, and every page has its own title, description and canonical URL → `FE-008` `FE-019` `FE-020`
- [ ] `PRE-025` No broken links or `#` placeholders → `FE-022`
- [ ] `PRE-026` FAQ answers match the real prices, refund and cancellation terms → `FE-024`

## P2 — Improvements
- [ ] `PRE-017` Lighthouse / accessibility score reviewed
- [ ] `PRE-018` Analytics events on the main funnel → `WEB-013`
