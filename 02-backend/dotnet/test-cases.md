# .NET — pre-launch test cases

- [ ] `DOTNET-006` **P0** Migrations apply on an empty DB
- [ ] `DOTNET-007` **P0** Global exception handler returns ProblemDetails without stack traces
- [ ] `DOTNET-008` **P1** Health checks endpoint
- [ ] `DOTNET-009` **P1** Rate limiting middleware on auth
- [ ] `DOTNET-021` **P0** `ASPNETCORE_ENVIRONMENT` is `Production` on the server (not Development from a Dockerfile or `launchSettings.json`)
- [ ] `DOTNET-022` **P1** Migrations are applied by one deploy step (`dotnet ef database update` or a migration bundle), not `Database.Migrate()` on every instance start (see `OPS-001`)
- [ ] `DOTNET-023` **P1** Data Protection keys are persisted and shared by all instances, so cookies and antiforgery tokens survive restarts and scale-out
- [ ] `DOTNET-024` **P1** `dotnet list package --vulnerable --include-transitive` shows no known vulnerabilities (see `SEC-010`)
