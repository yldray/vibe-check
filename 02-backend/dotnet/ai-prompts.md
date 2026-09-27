# .NET — AI audit prompts

Paste into Claude Code, Cursor or any agent:

```
Audit this .NET project for production readiness.
Check: [Authorize] and FallbackPolicy, entities bound from request bodies, JWT validation flags,
CORS SetIsOriginAllowed, FromSqlRaw with interpolation, ToList before Where, new HttpClient,
global request size limits, Task.Run in controllers, DbContext lifetime, Swagger in production,
deprecated packages, secrets in appsettings, Database.Migrate() at startup.
Output a table: severity (P0/P1/P2), file:line, issue, fix.
Do not change code until I approve.
```
