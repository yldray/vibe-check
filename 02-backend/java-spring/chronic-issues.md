# Java Spring — chronic issues

### JAVA-001 · LazyInitializationException
**Severity:** P1
**Why it breaks:** Lazy relations accessed after the transaction.
**How to test:** Call endpoints that return related data.
**Pass:** No exception, no N+1.
**Fix:** Fetch joins, DTO projections.

### JAVA-002 · Connection pool exhaustion
**Severity:** P0
**Why it breaks:** Long transactions or unclosed resources.
**How to test:** Load test; watch HikariCP metrics.
**Pass:** Pool never saturated.
**Fix:** Short transactions, timeouts, try-with-resources.

### JAVA-003 · Actuator endpoints exposed
**Severity:** P0
**Why it breaks:** All actuator endpoints public.
**How to test:** Call /actuator/env and /actuator/heapdump.
**Pass:** Not reachable publicly.
**Fix:** Expose only health; secure the rest.

### JAVA-006 · CSRF turned off while the browser logs in with a cookie
**Severity:** P0
**Why it breaks:** Spring Security answers a POST without a CSRF token with 403, so AI adds `csrf(AbstractHttpConfigurer::disable)` (or `csrf().disable()`, `ignoringRequestMatchers("/**")`). That is only safe when every request authenticates with an `Authorization` header. With `formLogin`, `httpBasic`, `oauth2Login`, remember-me, a server session, or a JWT the filter reads from a cookie, any website can make a logged-in user's browser change their e-mail, password or orders. State changes behind GET (`@GetMapping("/users/{id}/delete")`) are never CSRF-checked, even with CSRF on.
**How to test:** Search the security config for `csrf(` with `disable` or a broad `ignoringRequestMatchers`; if found, check how the browser authenticates (`formLogin`, `httpBasic`, `oauth2Login`, `rememberMe`, no `SessionCreationPolicy.STATELESS`, `@CookieValue` or `getCookies()` in a JWT filter, a JWT in `Set-Cookie`). Search for `@GetMapping` on delete, update and logout actions. Log in, then replay one POST with only the auth cookie and no token: `curl -i -X POST -b 'JSESSIONID=<value>' https://<host>/<endpoint>`.
**Pass:** 403 without the token, or there is no auth cookie at all (the token travels only in `Authorization`).
**Fix:** Remove the disable; for single-page apps use `csrf(c -> c.spa())` (Spring Security 7) or the `CookieCsrfTokenRepository` setup from the CSRF docs (6.x). Make state changes POST/PUT/DELETE; `server.servlet.session.cookie.same-site=lax` as a second layer. See `FE-002`.

### JAVA-007 · Everything is public unless it's listed
**Severity:** P0
**Why it breaks:** To make a 401 or 403 go away, AI ends the rules with `.anyRequest().permitAll()`, opens `requestMatchers("/**")` or `"/api/**"`, or moves paths into `web.ignoring()`, which skips the whole filter chain (no auth, no security headers). Rules are first-match, so a broad `permitAll()` above a `hasRole()` wins, and a chain limited by `securityMatcher("/api/**")` leaves every other path (`/admin`, `/h2-console`) with no security at all. Every endpoint added later is public.
**How to test:** Search for `anyRequest().permitAll()`, `permitAll()` on `"/**"` or `"/api/**"`, `web.ignoring()` / `WebSecurityCustomizer` and `securityMatcher(`, and read the matcher order. Call every controller path logged out.
**Pass:** The last rule is `anyRequest().authenticated()` (or `denyAll()`); public paths are listed one by one; no `web.ignoring()`; a catch-all chain follows any chain with a `securityMatcher`.
**Fix:** `requestMatchers(<public paths>).permitAll().anyRequest().authenticated()`; `permitAll()` instead of `ignoring()`. See `JAVA-004`, `DOTNET-010`, `AUTH-011`.

### JAVA-008 · `@PreAuthorize` that is never checked
**Severity:** P0
**Why it breaks:** AI guards admin actions with `@PreAuthorize("hasRole('ADMIN')")`, `@Secured` or `@RolesAllowed`, but Spring Boot doesn't turn method security on: without `@EnableMethodSecurity` the annotations do nothing, and `@Secured` / `@RolesAllowed` also need `securedEnabled = true` / `jsr250Enabled = true`. The check lives in a proxy, so it is also skipped on `private` methods and on calls from inside the same class. Any logged-in user can then call the admin action.
**How to test:** Search for `@PreAuthorize`, `@PostAuthorize`, `@Secured` and `@RolesAllowed`, then for `@EnableMethodSecurity` (or the deprecated `@EnableGlobalMethodSecurity(prePostEnabled = true)`) and its flags; check that annotated methods aren't `private` and are called from another bean. Log in as a normal user and call each annotated endpoint.
**Pass:** 403 on every one.
**Fix:** `@EnableMethodSecurity` (with `securedEnabled` / `jsr250Enabled` if needed) on a `@Configuration` class, plus URL rules for whole areas (`/admin/**` → `hasRole("ADMIN")`). See `AUTH-011`.

### JAVA-009 · CORS that echoes any origin with credentials
**Severity:** P0
**Why it breaks:** `allowedOrigins("*")` together with `allowCredentials(true)` throws at runtime, and Spring's error message suggests `allowedOriginPatterns`. So AI switches to `allowedOriginPatterns("*")`, `setAllowedOriginPatterns(List.of("*"))` or `@CrossOrigin(originPatterns = "*", allowCredentials = "true")`, and Spring then copies whatever `Origin` arrives into `Access-Control-Allow-Origin` with `Access-Control-Allow-Credentials: true`. Any website can call the API with the user's cookies and read the response.
**How to test:** Search for `allowedOriginPatterns`, `setAllowedOriginPatterns`, `originPatterns`, `allowCredentials`, `@CrossOrigin` and CORS keys in `application.*`; `curl -si -H 'Origin: https://example.org' https://<host>/<endpoint>` and read the CORS headers.
**Pass:** No CORS headers for an unknown origin; allowed origins are exact production hosts from configuration.
**Fix:** `allowedOrigins(<list from config>)`, or patterns tied to your own domain (`https://*.example.com`); `allowCredentials(true)` only if the frontend really sends cookies. See `SEC-005`, `DOTNET-013`.

### JAVA-010 · Homemade JWT filter that accepts forged tokens
**Severity:** P0
**Why it breaks:** Instead of Spring Security's resource server, AI writes a `OncePerRequestFilter` around a JWT library and gets the verification wrong: java-jwt's `JWT.decode(token)` doesn't verify the signature, jjwt's `parseClaimsJwt`, `parseUnsecuredClaims` or `.unsecured()` accept unsigned `alg: none` tokens, and before jjwt 0.12 the generic `parse(token)` returned unsigned tokens unchecked even with a key set. Or it signs with a key copied from a widely used tutorial (`404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970`) or a literal in code. Anyone can then mint an admin token.
**How to test:** Search for `JWT.decode(`, `parseClaimsJwt(`, `parseUnsecuredClaims(`, `.unsecured()`, a generic `.parse(` on a jjwt parser, `404E635266556A58`, and literals passed to `Keys.hmacShaKeyFor`, `Algorithm.HMAC256` or `signWith`. Then run `AUTH-001`'s tests: an edited payload with the old signature, and an `alg: none` token with no signature.
**Pass:** 401 for both; the key comes from the environment, differs per environment and is at least 256 bits.
**Fix:** `oauth2ResourceServer(o -> o.jwt(...))` with `NimbusJwtDecoder.withSecretKey(key)` (or a public key or issuer), or jjwt `Jwts.parser().verifyWith(key).build().parseSignedClaims(token)`; rotate every key that was ever in code or a tutorial. See `AUTH-001`, `SEC-009`.

### JAVA-011 · JPA entities as request and response bodies
**Severity:** P0
**Why it breaks:** AI takes the `@Entity` as `@RequestBody` (or `@ModelAttribute`) and calls `repository.save(entity)`, so a client can set any field (`role`, `owner`, `balance`, `verified`), and when the body carries an `id`, `save()` merges onto that existing row, so a "create" overwrites someone else's record. Returning entities sends every column (password hash, internal flags) and runs lazy loads; bidirectional relations loop ("Infinite recursion (StackOverflowError)"), which AI patches with scattered `@JsonIgnore`.
**How to test:** List the `@Entity` classes and search controllers for those types in `@RequestBody` / `@ModelAttribute` parameters and return types (`ResponseEntity<User>`, `List<Order>`). Send create and update calls with extra fields (`"role":"ADMIN"`, another user's `"id"`) and compare the rows; read a user through the API and search the JSON for `password`.
**Pass:** Request and response types are DTOs or records; extra fields are ignored; a client `id` is never used on create; no hash or internal field appears in any response.
**Fix:** One request DTO and one response DTO per endpoint, mapped explicitly; where form binding to an entity must stay, `@InitBinder` with `setAllowedFields`. See `DOTNET-011`, `UNI-014`.

### JAVA-012 · Bean Validation annotations that never run
**Severity:** P0
**Why it breaks:** AI puts `@NotBlank`, `@Email` and `@Min(1)` on the DTO, but `@Valid` is missing on the `@RequestBody` parameter (or on nested objects and lists inside it), or `spring-boot-starter-validation` is missing: the web starter hasn't included it since Boot 2.3, and if `jakarta.validation-api` still arrives through another library, the code compiles and validation silently does nothing. A `BindingResult` parameter that is never read swallows the errors too. Negative quantities and empty names reach the database.
**How to test:** Search for `@RequestBody` parameters without `@Valid` / `@Validated`, DTO fields of object or `List` type without `@Valid`, and `BindingResult` parameters in methods that never call `hasErrors()`. Check the build for `spring-boot-starter-validation` (the startup log must not say "Failed to set up a Bean Validation provider"). Send `{}`, negative numbers and a 10,000-character string to every write endpoint.
**Pass:** 400 with field errors every time.
**Fix:** Add the starter, `@Valid` on every body and nested field, and one `@RestControllerAdvice` for `MethodArgumentNotValidException` and `HandlerMethodValidationException`. See `UNI-005`.

### JAVA-013 · SQL, JPQL and MyBatis built from strings
**Severity:** P0
**Why it breaks:** Spring Data derived queries and `@Query` with `:param` are safe, so AI drops to raw strings for search and sorting: `jdbcTemplate.queryForList("... name = '" + name + "'")`, `entityManager.createQuery("..." + filter)`, `createNativeQuery`, `String.format` SQL, MyBatis `${}` instead of `#{}`, `"ORDER BY " + sort` and `JpaSort.unsafe(sort)`.
**How to test:** Search for `+` or `String.format` inside the arguments of `query`, `queryForList`, `queryForObject`, `update`, `execute`, `createQuery` and `createNativeQuery`; for `${` in MyBatis mappers and annotations, `JpaSort.unsafe(` and `ORDER BY` built from request values. Send `' OR '1'='1` to search parameters and `name,(select 1)` to sort parameters.
**Pass:** Values always go in as `?`, `:name` or `#{}` parameters; sort columns come from an allow-list.
**Fix:** `NamedParameterJdbcTemplate` or `setParameter`, `#{}` in MyBatis, and sort keys mapped through an allow-list into `Sort.by(...)`. See `SEC-004`.

### JAVA-014 · Upload names used as file paths
**Severity:** P0
**Why it breaks:** AI saves uploads with `Paths.get(uploadDir, file.getOriginalFilename())`, `new File(dir + file.getOriginalFilename())` or `transferTo(...)`. That name comes from the client, so `../../config/application.yml` writes outside the folder and two users uploading `photo.jpg` overwrite each other; `StringUtils.cleanPath` doesn't help (its Javadoc says not to rely on it for security). Download endpoints repeat the mistake with `?file=../../etc/passwd`.
**How to test:** Search for `getOriginalFilename()` and request parameters that reach `Paths.get`, `Path.resolve`, `new File`, `FileSystemResource`, `UrlResource` or `transferTo`. Upload with `curl -F 'file=@x.txt;filename=../x.txt' https://<host>/<upload>` and request a download with `?file=../application.properties`.
**Pass:** Files are stored under a generated name inside the upload folder; downloads look files up by id, or resolve and `normalize()` the path and check it stays inside the folder.
**Fix:** A generated stored name (UUID), the original name kept only as data, and `root.resolve(name).normalize().startsWith(root)`. See `SEC-008`.

### JAVA-015 · One user's data kept where every user shares it
**Severity:** P0
**Why it breaks:** Controllers and services are singletons shared by all requests, but AI puts per-request data in fields (`private User currentUser;`), uses a `static SimpleDateFormat` (not thread-safe), sets a `ThreadLocal` in a filter and never clears it while Tomcat reuses threads, or puts `@Cacheable` on a method like `getMyProfile()` that reads the logged-in user inside: with no parameters, every caller gets the first caller's cached result. Under load, users see each other's data.
**How to test:** In `@RestController`, `@Controller`, `@Service` and `@Component` classes, search for non-final instance fields assigned outside the constructor and mutable `static` fields; search for `SimpleDateFormat`, `ThreadLocal` without `remove()` in a `finally`, and `@Cacheable` methods that read `SecurityContextHolder` or `Principal` without it in the key. Call the "my …" endpoints as two users in parallel (`seq 50 | xargs -P 20 -I{} curl …`) and compare the responses.
**Pass:** Every response belongs to its caller.
**Fix:** Request data in local variables and parameters, `DateTimeFormatter`, `try { … } finally { holder.remove(); }`, and the user id passed into cached methods (`@Cacheable(key = "#userId")`). See `REACT-020`.

### JAVA-016 · Startup that wipes or rewrites the production database
**Severity:** P0
**Why it breaks:** AI lets Hibernate own the schema: `spring.jpa.hibernate.ddl-auto=create` or `create-drop` deletes all data on every start, and `update` never renames or drops anything, so the schema drifts. With H2 on the runtime classpath and no `spring.datasource.url`, Boot silently starts an in-memory database, and without Flyway or Liquibase `ddl-auto` then defaults to `create-drop`: one missing env var loses everything at restart. To get past a Flyway checksum error, AI sets `spring.flyway.clean-disabled=false` and calls `flyway.clean()`, or sets `spring.liquibase.drop-first=true`; `spring.sql.init.mode=always` reruns `data.sql` on every start.
**How to test:** Search every `application*.properties|yml`, env file and Java config for `ddl-auto`, `hbm2ddl`, `jdbc:h2:`, `clean-disabled`, `clean-on-validation-error`, `.clean()`, `FlywayMigrationStrategy`, `drop-first` and `sql.init.mode`. Check H2's scope in the build and `jar tf app.jar | grep -i h2`; the production startup log must not show `jdbc:h2:mem`.
**Pass:** `ddl-auto` is `none` or `validate` in production; Flyway or Liquibase owns the schema with clean disabled; no H2 in the production jar.
**Fix:** `spring.jpa.hibernate.ddl-auto=validate`, schema changes only through migrations, H2 in `test` scope, and `flyway repair` (never `clean`) for checksum errors. See `JAVA-005`, `OPS-001`.

### JAVA-017 · H2 console reachable in production
**Severity:** P0
**Why it breaks:** To look at the data, AI sets `spring.h2.console.enabled=true` (devtools also turns it on), adds `permitAll()` for `/h2-console/**`, disables CSRF and `frameOptions` for it (often for the whole app), and sets `spring.h2.console.settings.web-allow-others=true` so it works in Docker. The console is a web SQL client: whoever reaches it can read and change the database, and on H2 before 2.1.210 run code on the server (CVE-2021-42392, CVE-2022-23221). Even without `web-allow-others`, H2 serves any request from 127.0.0.1, which is every request behind a reverse proxy on the same host.
**How to test:** Search config and security code for `h2.console`, `h2-console`, `toH2Console()`, `web-allow-others` and `frameOptions` with `disable`; check H2's version and scope. Open `https://<production>/h2-console` from outside.
**Pass:** 404 on production; console settings exist only in a dev profile.
**Fix:** Remove the console from production config; keep `PathRequest.toH2Console()` rules in a `@Profile("dev")` filter chain; H2 2.1.210 or later anywhere it remains.

### JAVA-018 · Spring Data REST publishes every repository
**Severity:** P0
**Why it breaks:** AI adds `spring-boot-starter-data-rest` for "free CRUD". By default every public repository interface becomes a full REST resource: `UserRepository` turns into `GET/POST/PUT/PATCH/DELETE /users`, with every entity field (password hash, role) in the JSON. A `permitAll()` on that path lets anyone read and edit the table; plain `authenticated()` lets any logged-in user do it.
**How to test:** Search the build for `spring-boot-starter-data-rest` and the code for `@RepositoryRestResource` / `@RestResource`. Logged out and as a normal user, GET the base path (`spring.data.rest.base-path`, default `/`): its `_links` list every exported repository. Try `PATCH /users/{id}` with `{"role":"ADMIN"}`.
**Pass:** Only the intended repositories are exported, sensitive fields are hidden, and writes need the right role.
**Fix:** Remove the starter; if you keep it, `spring.data.rest.detection-strategy=annotated`, `@RepositoryRestResource(exported = false)` on user, payment and token repositories, and method security on repository methods.

### JAVA-019 · `@Transactional` that commits half the work
**Severity:** P1
**Why it breaks:** By default Spring rolls back only on unchecked exceptions, so a checked exception (`throws Exception`, `IOException`, a custom `extends Exception`) commits what was already written. `@Transactional` on a `private` method, or on a method called from the same class, does nothing, because the transaction lives in a proxy. AI also catches and logs the exception inside the transactional method, so the transaction commits. The order exists without its items, or money leaves one account and never arrives.
**How to test:** Search for `@Transactional` on `private` methods, `@Transactional` methods called through `this` from their own class, `@Transactional` methods that declare checked exceptions without `rollbackFor`, and `catch` blocks inside them that don't rethrow. Force the second write to fail and inspect both tables.
**Pass:** Either every write of the action is there, or none is.
**Fix:** `@Transactional` on a public method of the service the controller calls, `rollbackFor = Exception.class` or unchecked exceptions, and rethrow after logging. The same proxy rule silences `@Async` and `@Cacheable` on self-calls. See `UNI-021`.

### JAVA-020 · A slow outside call holds a thread and a database connection
**Severity:** P1
**Why it breaks:** AI creates HTTP clients with `new RestTemplate()`, `WebClient.create()` or `HttpClient.newHttpClient()`, none of which has a read or response timeout by default (`RestClient.create()` in a plain MVC app falls back to the JDK client), and calls them inside `@Transactional` methods. Boot's default `spring.jpa.open-in-view=true` also keeps the request's connection once a query has run. One slow partner API ties up Tomcat's threads and HikariCP's 10 connections, and every page fails with "Connection is not available, request timed out after 30000ms". AI's fixes for `LazyInitializationException` make it worse: leaving open-in-view on, or `hibernate.enable_lazy_load_no_trans=true`.
**How to test:** Search for those client constructors and for builders without `connectTimeout`, `readTimeout` or `responseTimeout`; check `spring.http.client.*` (Boot 3.4–3.5) or `spring.http.clients.*` (Boot 4) timeouts, `spring.jpa.open-in-view` and `enable_lazy_load_no_trans`; find HTTP calls inside `@Transactional` methods. Point a partner URL at a host that never answers, send 20 parallel requests and watch `hikaricp.connections.active` and a database-only endpoint.
**Pass:** Outside calls fail within their timeout, database-only endpoints keep answering, and `spring.jpa.open-in-view=false`.
**Fix:** Build clients from Boot's `RestClient.Builder` / `RestTemplateBuilder` with explicit timeouts; `spring.jpa.open-in-view=false` with fetch joins or DTO projections; call partners before or after the transaction. See `JAVA-001`, `JAVA-002`, `BE-009`.

### JAVA-021 · Passwords, tokens and personal data in the logs
**Severity:** P1
**Why it breaks:** To debug SQL or login, AI turns on `logging.level.org.hibernate.orm.jdbc.bind=TRACE` (Hibernate 6+; `org.hibernate.type.descriptor.sql` on 5), `@EnableWebSecurity(debug = true)`, `spring.mvc.log-request-details=true` with `org.springframework.web` at DEBUG, or a `CommonsRequestLoggingFilter` with `setIncludePayload(true)` / `setIncludeHeaders(true)`, and leaves it in the base `application.properties`. Bind logging writes every value sent to the database (password hashes, e-mails, reset tokens), and security debug prints every request header, `Authorization` and `Cookie` included.
**How to test:** Search `application*.properties|yml`, `logback*.xml` and code for those settings and for log calls that print request DTOs or tokens. Log in once on staging with a marker password, then search the logs for it and for the session cookie or JWT.
**Pass:** None of these settings exist outside a dev profile, and neither the marker password nor the token appears in the logs (`spring.jpa.show-sql=true` alone logs statements without values).
**Fix:** Debug logging in `application-dev.*` only, secret fields excluded from `toString()` (`@ToString.Exclude`), `Authorization` and `Cookie` dropped with `setHeaderPredicate`. See `ENV-004`, `BE-010`.
