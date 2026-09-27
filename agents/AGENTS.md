# vibe-check — AI pre-launch audit

> Source: https://github.com/<your-username>/vibe-check

When the user says **"vibe check"**, **"pre-launch check"** or asks if the project is ready to ship, run this audit.

## Step 1 — Detect the stack
Read package.json, *.csproj, pom.xml / build.gradle, requirements.txt / pyproject.toml, app.json / app.config.*, pubspec.yaml, AndroidManifest.xml, Info.plist. List the stacks you found.

## Step 2 — Universal P0 checks (always run)
- [ ] No secrets in code or git history (API keys, tokens, passwords, connection strings)
- [ ] No secrets in frontend or mobile bundles (anything shipped to the client is public)
- [ ] `.env` files are in `.gitignore`; an `.env.example` exists
- [ ] Every protected endpoint checks auth AND authorization (user A cannot read user B's data)
- [ ] Input is validated on the server, not only on the client
- [ ] No SQL / NoSQL injection (parameterized queries only)
- [ ] CORS is not `*` on authenticated APIs
- [ ] Errors do not leak stack traces or internal details to users
- [ ] No mock data, fake users, test flags or "TODO: add auth" left in production paths
- [ ] Every imported package really exists and is the intended one (hallucinated package check)
- [ ] List endpoints are paginated
- [ ] Rate limiting on login, signup, password reset and paid/AI endpoints
- [ ] HTTPS only; cookies are `Secure` + `HttpOnly` + `SameSite`
- [ ] Database has backups and migrations run cleanly on an empty DB
- [ ] Error tracking / logging exists in production
- [ ] Privacy policy exists if you collect any personal data

## Step 3 — Stack-specific checks
For each detected stack, apply the matching `chronic-issues.md` and `test-cases.md` from the source repo. If you cannot access it, use your own knowledge of that stack's most common production bugs.

## Step 4 — Report
Output exactly this format:

```
VIBE CHECK REPORT
Stacks: <detected>

| # | Severity | Check | Status | File:line | Fix |
|---|----------|-------|--------|-----------|-----|

P0: <n> · P1: <n> · P2: <n>
VERDICT: 🟢 READY / 🔴 NOT READY (any P0 = NOT READY)
```

## Rules
- Do not fix anything until the user approves the report.
- Do not mark a check PASS without looking at the code.
- If unsure, mark it `NEEDS REVIEW`, never PASS.
