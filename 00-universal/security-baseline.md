# Security baseline

- [ ] `SEC-001` **P0** Secrets only in env / secret manager
- [ ] `SEC-002` **P0** Passwords hashed with bcrypt / argon2 (never plain, never MD5/SHA1)
- [ ] `SEC-003` **P0** Auth + authorization on every protected route
- [ ] `SEC-004` **P0** Parameterized queries
- [ ] `SEC-005` **P0** CORS restricted to known origins
- [ ] `SEC-006` **P1** Security headers: `Strict-Transport-Security`, `Content-Security-Policy`, `X-Content-Type-Options`, `Referrer-Policy`
- [ ] `SEC-007` **P1** Rate limiting on login, signup, reset, OTP, AI endpoints
- [ ] `SEC-008` **P1** File uploads: type + size check, stored outside web root, no executable files
- [ ] `SEC-009` **P1** JWT: short expiry, refresh flow, secret is long and random
- [ ] `SEC-010` **P1** Dependency audit clean of critical vulnerabilities
- [ ] `SEC-011` **P2** 2FA for admin accounts
