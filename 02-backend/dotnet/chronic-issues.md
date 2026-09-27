# .NET — chronic issues

> 🌱 Seeded list. Contributions welcome.

### DOTNET-001 · EF Core N+1 queries
**Severity:** P1
**Why it breaks:** AI loops over navigation properties.
**How to test:** Enable SQL logging; call a list endpoint with 100 rows.
**Pass:** Constant number of queries.
**Fix:** Include() or projection with Select().

### DOTNET-002 · async void / sync-over-async
**Severity:** P0
**Why it breaks:** `.Result` / `.Wait()` or async void cause deadlocks and lost exceptions.
**How to test:** Search for `.Result`, `.Wait()`, `async void`; load test.
**Pass:** None found (except event handlers).
**Fix:** async/await all the way.

### DOTNET-003 · Wrong DbContext lifetime
**Severity:** P0
**Why it breaks:** DbContext as singleton or shared across threads.
**How to test:** Parallel requests under load.
**Pass:** No concurrency exceptions.
**Fix:** Scoped DbContext; IDbContextFactory for background work.

### DOTNET-004 · [Authorize] missing or AllowAnonymous leftovers
**Severity:** P0
**Why it breaks:** AI adds AllowAnonymous to fix a 401.
**How to test:** Call every controller without a token.
**Pass:** 401/403 on protected ones.
**Fix:** Global authorization policy + explicit anonymous list.

### DOTNET-005 · Secrets in appsettings.json
**Severity:** P0
**Why it breaks:** Connection strings committed.
**How to test:** Search appsettings*.json in git history.
**Pass:** No production secrets.
**Fix:** User secrets, env vars, Key Vault.
