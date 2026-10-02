# .NET — pre-launch test cases

- [ ] `DOTNET-006` **P0** Migrations apply on an empty DB
- [ ] `DOTNET-007` **P0** Global exception handler returns ProblemDetails without stack traces
- [ ] `DOTNET-008` **P1** Health checks endpoint
- [ ] `DOTNET-009` **P1** Rate limiting middleware on auth
- [ ] `DOTNET-021` **P0** `ASPNETCORE_ENVIRONMENT` is `Production` on the server (not Development from a Dockerfile or `launchSettings.json`)
- [ ] `DOTNET-022` **P1** Migrations are applied by one deploy step (`dotnet ef database update` or a migration bundle), not `Database.Migrate()` on every instance start (see `OPS-001`)
- [ ] `DOTNET-023` **P1** Data Protection keys are persisted and shared by all instances, so cookies and antiforgery tokens survive restarts and scale-out
- [ ] `DOTNET-024` **P1** `dotnet list package --vulnerable --include-transitive` shows no known vulnerabilities (see `SEC-010`)
- [ ] `DOTNET-036` **P1** `TargetFramework` is a supported .NET: `net10.0` (LTS, supported until 2028-11-14). `net8.0`, `net9.0` and EF Core 8/9 stop getting security fixes on 2026-11-10; `net7.0` and older already have. Test: `grep -rn "<TargetFramework" --include=*.csproj --include=*.props .`
- [ ] `DOTNET-037` **P0** The server runs the runtime the app targets: the IIS Hosting Bundle or the Docker `FROM mcr.microsoft.com/dotnet/aspnet:<version>` tag matches `TargetFramework`, and the platform sends traffic to the port the container listens on (8080 by default since .NET 8, not 80). Test: after every framework upgrade, deploy to staging and open the site: no "HTTP Error 500.30" / "500.31", no 502
- [ ] `DOTNET-038` **P1** The production schema comes only from migrations that match the model: no `Database.EnsureCreated()` outside tests (it does nothing once any table exists, so later tables never arrive) and no suppressed `RelationalEventId.PendingModelChangesWarning`. Test: `dotnet ef migrations has-pending-model-changes` passes in CI (see `OPS-001`)
