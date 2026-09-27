# Node.js — pre-launch test cases

- [ ] **P0** All env vars validated on startup
- [ ] **P0** Every protected route tested without token and with another user's token
- [ ] **P0** Input validation schema on every write route
- [ ] **P0** Webhooks: signature + idempotency
- [ ] **P1** Graceful shutdown (SIGTERM closes server and DB)
- [ ] **P1** Health check endpoint
- [ ] **P1** Helmet / security headers
- [ ] **P1** Rate limiting on auth + expensive routes
- [ ] **P1** Load test main endpoints
- [ ] **P2** OpenAPI docs
