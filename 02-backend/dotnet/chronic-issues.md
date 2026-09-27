# .NET — chronic issues

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

### DOTNET-010 · No fallback authorization policy
**Severity:** P1
**Why it breaks:** AI protects controllers one by one. The next controller or minimal API endpoint without `[Authorize]` is public.
**How to test:** Look for `FallbackPolicy` in `Program.cs`; call every endpoint without a token.
**Pass:** A fallback policy requires an authenticated user; public endpoints are marked `[AllowAnonymous]` / `.AllowAnonymous()` on purpose.
**Fix:** `options.FallbackPolicy = new AuthorizationPolicyBuilder().RequireAuthenticatedUser().Build();` in `AddAuthorization`.

### DOTNET-011 · Request bodies bound straight to entities
**Severity:** P0
**Why it breaks:** AI takes an EF entity as the action parameter and saves it (`_db.Update(user)`), so a client can set any column: `IsAdmin`, `UserId`, `Balance`.
**How to test:** Send extra fields (`"isAdmin": true`, another user's `userId`) in create and update requests.
**Pass:** They are ignored.
**Fix:** Request DTOs with only the allowed fields, mapped explicitly onto the entity.

### DOTNET-012 · JWT validation switched off
**Severity:** P0
**Why it breaks:** To get tokens working, AI sets `ValidateIssuer`, `ValidateAudience` or `ValidateLifetime` to `false`, or hardcodes a short signing key.
**How to test:** Read `TokenValidationParameters`; send an expired token and one signed for another audience.
**Pass:** Both get 401; the key comes from configuration and is at least 256 bits for HS256.
**Fix:** Validate issuer, audience, lifetime and signing key. See `AUTH-001`.

### DOTNET-013 · CORS open to every origin with credentials
**Severity:** P0
**Why it breaks:** `AllowAnyOrigin()` can't be combined with `AllowCredentials()`, so AI "fixes" the error with `SetIsOriginAllowed(_ => true)`, which lets any site make authenticated calls.
**How to test:** Search for `SetIsOriginAllowed` and `AllowAnyOrigin`; send a request with `Origin: https://example.org`.
**Pass:** Only your own origins are allowed.
**Fix:** `WithOrigins(...)` with the exact production origins from configuration. See `SEC-005`.

### DOTNET-014 · Raw SQL built with string interpolation
**Severity:** P0
**Why it breaks:** `FromSqlRaw($"... {id}")` and `ExecuteSqlRaw` with concatenation are not parameterized, unlike `FromSql` and `FromSqlInterpolated`.
**How to test:** Search for `FromSqlRaw(` and `ExecuteSqlRaw(` followed by `$"` or `+`.
**Pass:** None found.
**Fix:** `FromSql` / `FromSqlInterpolated`, or `FromSqlRaw` with parameters.

### DOTNET-015 · Filtering in memory
**Severity:** P1
**Why it breaks:** AI calls `.ToList()` or `.AsEnumerable()` before `.Where()` or paging, so the whole table is loaded into memory; read-only queries are tracked for no reason.
**How to test:** Turn on EF SQL logging and call the list endpoints; search for `.ToList()` followed by `.Where(`.
**Pass:** Filtering and paging run in SQL; read-only queries use `AsNoTracking()` or a `Select` projection.
**Fix:** Keep the query `IQueryable` until the end; project with `Select`.

### DOTNET-016 · `new HttpClient()` on every call
**Severity:** P1
**Why it breaks:** Creating a client per request exhausts sockets under load; AI also leaves the default 100-second timeout.
**How to test:** Search for `new HttpClient(`; load test an endpoint that calls another service.
**Pass:** `IHttpClientFactory` or typed clients, each with a timeout that fits the call.
**Fix:** `builder.Services.AddHttpClient<T>(c => c.Timeout = ...)`. See `BE-009`.

### DOTNET-017 · Request size limit raised for every endpoint
**Severity:** P1
**Why it breaks:** For one upload, AI raises Kestrel's `MaxRequestBodySize` (or IIS `maxAllowedContentLength`) globally, so every endpoint accepts huge bodies.
**How to test:** Check the Kestrel options and `web.config`; send a very large body to a non-upload endpoint.
**Pass:** The default limit applies everywhere except the upload endpoint.
**Fix:** `[RequestSizeLimit]` on the upload endpoint only.

### DOTNET-018 · Fire-and-forget background work
**Severity:** P1
**Why it breaks:** AI starts `Task.Run(...)` from a controller, or injects a `DbContext` into a singleton hosted service. The work dies on shutdown or throws `ObjectDisposedException`.
**How to test:** Search controllers for `Task.Run(` and hosted service constructors for `DbContext`.
**Pass:** Background work goes through a queue (a `Channel` read by a hosted service that creates its own scope) or a job library.
**Fix:** `IServiceScopeFactory` inside hosted services; Hangfire or Quartz for scheduled jobs. See `DOTNET-003`.

### DOTNET-019 · Swagger open in production
**Severity:** P1
**Why it breaks:** AI calls `UseSwagger()` / `MapOpenApi()` outside `IsDevelopment()`, publishing a map of every endpoint and model.
**How to test:** Open `/swagger` and `/openapi/v1.json` on production.
**Pass:** Not found, or behind authentication.
**Fix:** Wrap it in `if (app.Environment.IsDevelopment())`, or protect it.

### DOTNET-020 · Deprecated packages and APIs from training data
**Severity:** P1
**Why it breaks:** AI adds what was common years ago, e.g. FluentValidation.AspNetCore automatic validation, which its authors no longer recommend for new projects.
**How to test:** `dotnet list package --deprecated` and the build warnings.
**Pass:** No deprecated packages and no obsolete-API warnings.
**Fix:** Move to the current package or API. See `UNI-009`.
