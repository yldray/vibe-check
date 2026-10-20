# Backend — common checks

- [ ] `BE-001` **P0** Auth + authorization on every protected endpoint
- [ ] `BE-002` **P0** Server-side validation
- [ ] `BE-003` **P0** Parameterized queries
- [ ] `BE-004` **P0** Errors don't leak internals
- [ ] `BE-005` **P1** Consistent API error format
- [ ] `BE-006` **P1** Pagination on lists
- [ ] `BE-007` **P1** Idempotent payment / webhook handling
- [ ] `BE-008` **P1** Webhook signatures verified
- [ ] `BE-009` **P1** Timeouts on every outbound HTTP call
- [ ] `BE-010` **P1** Structured logging with request IDs; no personal data and no secrets in logs. HTTP client logging and tracing record each outbound URL (so do proxies and the receiving server), so a key or token in the query string (`access_token=`, `key=`, `sig=`) ends up in log files and error trackers (.NET `IHttpClientFactory` logs the full URL at Information before .NET 9, or when `System.Net.Http.DisableUriRedaction` is set); send credentials in headers, and redact or remove the client's loggers (`RedactLoggedHeaders`, `RemoveAllLoggers()`). Test: grep outbound calls for tokens appended to URLs and search production logs for `access_token=`, `key=` and `token=`
- [ ] `BE-011` **P1** Health check endpoint
- [ ] `BE-012` **P1** Migrations run cleanly on an empty DB
- [ ] `BE-013` **P2** API docs (OpenAPI)
