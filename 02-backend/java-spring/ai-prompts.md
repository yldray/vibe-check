# Java Spring — AI audit prompts

Paste into Claude Code, Cursor or any agent:

```
Audit this Java Spring project for production readiness.
Check: csrf disabled with cookie or session login, permitAll / web.ignoring() / anyRequest order,
@PreAuthorize without @EnableMethodSecurity, allowedOriginPatterns("*") with credentials, homemade
JWT filters (JWT.decode, parseClaimsJwt, tutorial keys), entities as request or response bodies,
@Valid and spring-boot-starter-validation, SQL / JPQL / MyBatis ${} built from strings, upload names
in paths, per-user state in singletons, static SimpleDateFormat, ThreadLocal and @Cacheable keys,
ddl-auto / H2 / flyway clean in production, the H2 console, Spring Data REST exports,
@Transactional on private methods or with checked exceptions, client timeouts and open-in-view,
bind / security debug logging, actuator and Swagger exposure, error details in responses, active
profiles and secret fallbacks, password encoders, th:utext, multipart limits, forwarded headers,
LazyInitializationException, connection pool, migrations, Boot version support.
Output a table: severity (P0/P1/P2), file:line, issue, fix.
Do not change code until I approve.
```
