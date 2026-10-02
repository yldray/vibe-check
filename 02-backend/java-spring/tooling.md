# Java Spring — tooling

| Purpose | Tool |
|---|---|
| Unit | JUnit 5 + Mockito |
| Integration | Spring Boot Test, Testcontainers |
| Load | Gatling, k6 |
| Static analysis | Semgrep (`semgrep --config p/java`: disabled CSRF, actuator exposure, SQL injection, file paths, unverified JWTs); CodeQL Java security queries |
| Dependencies | OWASP Dependency-Check (Maven / Gradle plugin), OSV-Scanner (`osv-scanner scan source -r .`), `mvn versions:display-dependency-updates` |
| Pool and threads | Actuator metrics `hikaricp.connections.active` / `.pending` |
| Packaging | `jar tf app.jar` (no devtools or H2 in the production jar) |
| Scheduled jobs on several instances | ShedLock (`@SchedulerLock`) |
| User HTML | OWASP Java HTML Sanitizer |
| Probes | curl: CSRF replay without a token, CORS `Origin`, fake `X-Forwarded-For`, `filename=../x.txt` uploads |
