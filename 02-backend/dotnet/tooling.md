# .NET — tooling

| Purpose | Tool |
|---|---|
| Unit | xUnit + FluentAssertions |
| Integration | WebApplicationFactory, Testcontainers |
| Load | k6, NBomber |
| Migrations | `dotnet ef migrations has-pending-model-changes` (CI), `dotnet ef migrations script` |
| Vulnerable / deprecated packages | `dotnet list package --vulnerable --include-transitive`, `dotnet list package --deprecated` |
| Runtime on the server | `dotnet --list-runtimes`; .NET Hosting Bundle for IIS |
| Support dates | dotnet/core `release-notes/releases-index.json` |
| HTML sanitizing | HtmlSanitizer (NuGet) |
| SignalR probes | `@microsoft/signalr` client in the browser console, signed in as two users |
