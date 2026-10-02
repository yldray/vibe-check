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
**Why it breaks:** DbContext as singleton or shared across threads: `Task.WhenAll` over queries on one context, or a context injected into a Blazor Server component, which lives as long as the circuit ("A second operation was started on this context instance").
**How to test:** Parallel requests under load; grep for `Task.WhenAll` over queries that share a context and for `@inject <X>DbContext` in `.razor` files.
**Pass:** No concurrency exceptions.
**Fix:** Scoped DbContext; `IDbContextFactory` for background work, parallel queries and Blazor components.

### DOTNET-004 · [Authorize] missing or AllowAnonymous leftovers
**Severity:** P0
**Why it breaks:** AI adds AllowAnonymous to fix a 401.
**How to test:** Call every controller without a token.
**Pass:** 401/403 on protected ones.
**Fix:** Global authorization policy + explicit anonymous list.

### DOTNET-005 · Secrets in appsettings.json
**Severity:** P0
**Why it breaks:** Connection strings committed. In Blazor WebAssembly (and `.Client` projects) every `wwwroot/appsettings*.json` value is downloaded by the browser, committed or not.
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

### DOTNET-025 · EF entities returned from endpoints
**Severity:** P0
**Why it breaks:** AI returns EF entities straight from controllers and minimal APIs. Navigation properties form a cycle and System.Text.Json throws "A possible object cycle was detected", which AI silences with `ReferenceHandler.IgnoreCycles` (or `Preserve`, or Json.NET `ReferenceLoopHandling.Ignore`) instead of adding a DTO. Now every loaded navigation goes out: the `ApplicationUser` behind a post with its `PasswordHash`, `SecurityStamp`, e-mail and phone number, a customer's other orders, other users' rows.
**How to test:** Grep for `ReferenceHandler.IgnoreCycles`, `ReferenceHandler.Preserve` and `ReferenceLoopHandling.Ignore`, and for endpoints that return an entity type or an `IdentityUser` subclass. Call every list and detail endpoint and search the JSON for `passwordHash`, `securityStamp`, `$id` and nested objects you didn't mean to send.
**Pass:** Every endpoint returns a response DTO; no Identity field or unrelated record appears in any response.
**Fix:** Project to a response type (`.Select(o => new OrderDto(o.Id, o.Total))`) and remove the cycle setting. See `DOTNET-011`.

### DOTNET-026 · One user's data served to another
**Severity:** P0
**Why it breaks:** AI keeps per-user state where every user shares it: a Blazor Server state container or cart registered with `AddSingleton` (right in WebAssembly, one object for all users on the server), a `static` field holding the current user, cart or tenant, a scoped service captured by a singleton (only Development's `ValidateScopes` throws), personal data cached under a fixed key in `IMemoryCache` or `HybridCache`, or `[ResponseCache(Duration = 60)]`, which defaults to `Cache-Control: public`; `UseResponseCaching()` skips only requests with an `Authorization` header, so cookie-authenticated pages are cached and served to the next visitor.
**How to test:** Read every `AddSingleton<...>` class for user, cart, session or tenant fields; grep services, controllers and components for `static` fields holding user data or mutable collections; check that cache keys for personal data include the user or tenant id; grep `[ResponseCache(` on personal endpoints. Log in as two users in two browsers and run the same flow at the same time.
**Pass:** Each user only ever sees their own data; personal responses send `Cache-Control: private` or `no-store`.
**Fix:** `AddScoped` for per-user state (one instance per circuit in Blazor Server), no mutable statics, the user read per call (`AuthenticationStateProvider` in Blazor), the user or tenant id in every cache key, and `[ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]` on personal endpoints. See `WEB-016`.

### DOTNET-027 · Uploads saved under the client's file name
**Severity:** P0
**Why it breaks:** AI saves uploads with `Path.Combine(env.WebRootPath, "uploads", file.FileName)`. `IFormFile.FileName` is whatever the client sent, so `../../appsettings.json` walks out of the folder, and `Path.Combine` returns the second argument alone when it is a rooted path (`/etc/...`, `C:\...`). Two users who upload `photo.jpg` overwrite each other, and every file under `wwwroot` is public.
**How to test:** Grep for `.FileName` reaching `Path.Combine`, `File.Create`, `new FileStream` or `CopyToAsync`, and for `WebRootPath` in upload code. Upload with `curl -F "file=@x.txt;filename=../../x.txt"`, then upload two different files named `photo.jpg` from two accounts.
**Pass:** Files land outside `wwwroot` under server-generated names; both photos survive; nothing is written outside the upload folder.
**Fix:** `Path.Combine(uploadRoot, Path.GetRandomFileName() + ext)` with `ext` from an allow-list; keep the original name only in the database for display. See `SEC-008`.

### DOTNET-028 · Validation attributes that never run
**Severity:** P0
**Why it breaks:** AI puts `[Required]`, `[Range]` and `[EmailAddress]` on request models and trusts them. Minimal APIs ignore them unless `builder.Services.AddValidation()` is called (.NET 10+; .NET 8 and 9 have no built-in minimal API validation), and controllers without `[ApiController]`, or with `SuppressModelStateInvalidFilter = true`, run the action anyway unless it checks `ModelState.IsValid`. Nothing logs a warning, and negative quantities, empty names and broken e-mails reach the database.
**How to test:** Grep for `AddValidation(`, `[ApiController]`, `SuppressModelStateInvalidFilter` and `ModelState.IsValid`. Send every write endpoint a body that breaks each attribute (`"quantity": -5`, `"email": "x"`, a missing required field).
**Pass:** Each gets a 400 with the field errors, and nothing is saved.
**Fix:** .NET 10+: `builder.Services.AddValidation();` in the project that maps the endpoints; .NET 8/9: an endpoint filter that validates every request model; `[ApiController]` on API controllers. See `UNI-005`.

### DOTNET-029 · Identity shipped with template defaults
**Severity:** P0
**Why it breaks:** The scaffolded login calls `PasswordSignInAsync(..., lockoutOnFailure: false)`, so wrong passwords never lock an account. No real e-mail sender is registered: Identity UI falls back to `NoOpEmailSender` (the Blazor template registers `IdentityNoOpEmailSender`), so confirmation and reset e-mails go nowhere, and the anonymous `RegisterConfirmation` page shows "Click here to confirm your account" for any registered e-mail in its query string. Anyone can confirm an address they don't own, and real users can't reset a password.
**How to test:** Grep for `lockoutOnFailure: false`, `IdentityNoOpEmailSender` and `NoOpEmailSender`, and look for your own `IEmailSender` registration. Logged out, open `/Account/RegisterConfirmation?email=<an unconfirmed user>` (`/Identity/Account/...` with Identity UI). Enter a wrong password 6 times, then the right one.
**Pass:** No confirm link on the page; the account locks after `MaxFailedAccessAttempts` (5) for `DefaultLockoutTimeSpan` (5 minutes); a reset e-mail arrives.
**Fix:** `lockoutOnFailure: true`; register a real `IEmailSender<TUser>` (`IEmailSender` for Identity UI) and delete the no-op branch from `RegisterConfirmation`. See `AUTH-007`, `AUTH-009`.

### DOTNET-030 · User HTML rendered with `Html.Raw` or `MarkupString`
**Severity:** P0
**Why it breaks:** To show formatted descriptions, comments or AI answers, AI writes `@Html.Raw(Model.Description)`, `new HtmlString(...)` or Blazor `@((MarkupString)message.Text)`, often with HTML from Markdig's `Markdown.ToHtml(...)`. These skip Razor's encoding, and Markdig passes raw HTML through unless the pipeline calls `DisableHtml()`, so one saved `<img src=x onerror=...>` runs in every visitor's session.
**How to test:** Grep `.cshtml`, `.razor` and `.cs` files for `Html.Raw(`, `HtmlString(`, `MarkupString` and `Markdown.ToHtml(`. Save `<img src=x onerror=alert(1)>`, plain and inside Markdown, into every field, chat message and model answer that reaches one of them, and open the page as another user.
**Pass:** No alert; the payload shows as text or is removed.
**Fix:** Render as text (Razor encodes `@value`), or run the final HTML through an allow-list sanitizer (`new HtmlSanitizer().Sanitize(html)`) before `Html.Raw` / `MarkupString`. See `REACT-006`, `LLM-005`.

### DOTNET-031 · SignalR groups and users chosen by the client
**Severity:** P0
**Why it breaks:** AI copies the docs sample `AddToGroup(string groupName) => Groups.AddToGroupAsync(Context.ConnectionId, groupName)` and hub methods like `SendPrivateMessage(string user, ...)` that call `Clients.User(user)`. Any logged-in user can join another room's, order's or tenant's group and read its messages, or message anyone: `[Authorize]` on the hub only proves the caller is signed in, and the docs say groups aren't a security feature.
**How to test:** Grep hubs for methods with a group, room, tenant or user id parameter that reaches `Groups.AddToGroupAsync`, `Clients.Group(` or `Clients.User(`. From the browser console (`connection.invoke(...)`), join another tenant's group and send to another user's id.
**Pass:** The hub refuses, or builds the group from `Context.UserIdentifier` plus a membership check in the database.
**Fix:** Check membership before `AddToGroupAsync`; derive personal groups from `Context.UserIdentifier`, never from a parameter. See `AUTH-011`, `UNI-004`.

### DOTNET-032 · Rate limits that never apply
**Severity:** P1
**Why it breaks:** AI adds `[EnableRateLimiting("login")]` or `.RequireRateLimiting(...)`, but `app.UseRateLimiter()` is missing or runs before an explicit `app.UseRouting()`, so no endpoint policy runs and nothing warns. Or the partition key is `User.Identity?.Name ?? "anonymous"` (all anonymous logins share one bucket) or `RemoteIpAddress`, which behind a proxy is the proxy because `UseForwardedHeaders` trusts only loopback by default. The usual fix, `KnownNetworks.Clear(); KnownProxies.Clear();` (or `ASPNETCORE_FORWARDEDHEADERS_ENABLED=true`), lets anyone who reaches the app directly pick their own IP with `X-Forwarded-For`.
**How to test:** In `Program.cs`, `UseForwardedHeaders()` comes first and `UseRateLimiter()` after any explicit `UseRouting()`. Send 20 failed logins fast, again with a new `X-Forwarded-For` each time, and once from a second network; on production, log `RemoteIpAddress` and `Request.Scheme` for your own request.
**Pass:** Requests over the limit get 429 (set `RejectionStatusCode = 429`; the default is 503); a fake header doesn't reset the count; the log shows your real IP and `https`.
**Fix:** `UseRateLimiter()` after `UseRouting()`; partition anonymous endpoints by client IP; add the proxy to `KnownProxies` / `KnownIPNetworks` (`KnownNetworks` before .NET 10) instead of clearing them. See `SEC-007`.

### DOTNET-033 · One background exception stops the whole app
**Severity:** P1
**Why it breaks:** AI writes a `BackgroundService` loop (`while (!stoppingToken.IsCancellationRequested) { await DoWorkAsync(); await Task.Delay(...); }`) with no try/catch inside. Since .NET 6, an unhandled exception from `ExecuteAsync` stops the host (`BackgroundServiceExceptionBehavior.StopHost`), so one database timeout in a cleanup job takes the API down with it, and through .NET 10 the process exits with code 0, which a service manager that restarts only on failure leaves down. The opposite fix, `BackgroundServiceExceptionBehavior.Ignore`, keeps the API up while the job stays dead.
**How to test:** Grep for `: BackgroundService` and check that each `ExecuteAsync` loop catches errors per iteration; grep for `BackgroundServiceExceptionBehavior`. In staging, stop the database for 30 seconds while a job runs.
**Pass:** The API keeps answering; the job logs the error and runs again once the database is back.
**Fix:** try/catch inside the loop (log, wait, continue), letting `OperationCanceledException` end it on shutdown; `Restart=always` for the service. See `OPS-004`.

### DOTNET-034 · Debug switches and certificate bypasses left on
**Severity:** P1
**Why it breaks:** To chase one bug, AI turns on diagnostics in shared startup code and leaves them: EF Core `EnableSensitiveDataLogging()` (parameter values in logs and exception messages), `IdentityModelEventSource.ShowPII` and `LogCompleteSecurityArtifact` (whole tokens in logs), `HttpLoggingFields.All` / `RequestBody` (login passwords in logs), SignalR `EnableDetailedErrors` and Blazor `DetailedErrors` (exception text sent to clients). To get past certificate errors it adds `TrustServerCertificate=True` or `Encrypt=False` to the SQL Server connection string, or `DangerousAcceptAnyServerCertificateValidator` / a validation callback that returns `true` to `HttpClient` or SMTP code.
**How to test:** `grep -rniE "EnableSensitiveDataLogging|ShowPII|LogCompleteSecurityArtifact|HttpLoggingFields\.(All|RequestBody)|DetailedErrors|TrustServerCertificate|Encrypt=False|DangerousAcceptAny|ValidationCallback"` over code, `appsettings*.json` and deploy variables.
**Pass:** Every hit is inside `if (builder.Environment.IsDevelopment())` or only in `appsettings.Development.json`; production connections validate the server certificate.
**Fix:** Guard diagnostics with `IsDevelopment()`; give the database a certificate the app trusts instead of bypassing the check. See `ENV-004`, `LEGAL-006`.

### DOTNET-035 · Decimal columns cut to two places
**Severity:** P1
**Why it breaks:** AI writes `public decimal Price { get; set; }` and never sets a precision. On SQL Server, EF Core then creates `decimal(18,2)` and only logs "No store type was specified for the decimal property … values will be silently truncated", so exchange rates, unit prices with 3 or 4 decimals and tax rates kept as fractions (0.075) lose digits on every save.
**How to test:** Search the `dotnet ef migrations add` output for "No store type was specified for the decimal property"; grep entities for `decimal` properties without `[Precision]`, `HasPrecision` or `HasColumnType`, and migrations for `decimal(18,2)`. Save the most precise real value each column must hold and read it back.
**Pass:** Every decimal column has a chosen precision and scale; real values round-trip unchanged.
**Fix:** `[Precision(18, 4)]` on the property, or `HasPrecision(18, 4)` in `OnModelCreating`, plus a migration. See `UNI-025`, `PAY-008`.
