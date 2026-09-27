# Security baseline

- [ ] **P0** Secrets only in env / secret manager
- [ ] **P0** Passwords hashed with bcrypt / argon2 (never plain, never MD5/SHA1)
- [ ] **P0** Auth + authorization on every protected route
- [ ] **P0** Parameterized queries
- [ ] **P0** CORS restricted to known origins
- [ ] **P1** Security headers: `Strict-Transport-Security`, `Content-Security-Policy`, `X-Content-Type-Options`, `Referrer-Policy`
- [ ] **P1** Rate limiting on login, signup, reset, OTP, AI endpoints
- [ ] **P1** File uploads: type + size check, stored outside web root, no executable files
- [ ] **P1** JWT: short expiry, refresh flow, secret is long and random
- [ ] **P1** Dependency audit clean of critical vulnerabilities
- [ ] **P2** 2FA for admin accounts
