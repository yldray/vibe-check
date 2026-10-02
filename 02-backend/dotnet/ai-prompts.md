# .NET — AI audit prompts

Paste into Claude Code, Cursor or any agent:

```
Audit this .NET project for production readiness.
Check: [Authorize] and FallbackPolicy, entities bound from request bodies, JWT validation flags,
CORS SetIsOriginAllowed, FromSqlRaw with interpolation, ToList before Where, new HttpClient,
global request size limits, Task.Run in controllers, DbContext lifetime, Swagger in production,
deprecated packages, secrets in appsettings, Database.Migrate() at startup,
EF entities returned from endpoints (IgnoreCycles), singleton or static per-user state and
[ResponseCache] on personal endpoints, IFormFile.FileName in paths, AddValidation / [ApiController],
lockoutOnFailure and no-op e-mail senders, Html.Raw / MarkupString, SignalR groups from parameters,
UseRateLimiter order and KnownProxies, BackgroundService loops without try/catch,
EnableSensitiveDataLogging / ShowPII / TrustServerCertificate, decimal precision, TargetFramework
end of support, hosting runtime and container port, EnsureCreated.
Output a table: severity (P0/P1/P2), file:line, issue, fix.
Do not change code until I approve.
```
