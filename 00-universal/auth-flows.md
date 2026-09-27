# Auth flows

Login, sessions, password reset and one-time codes: where AI-written auth breaks.

### AUTH-001 · Token decoded, never verified
**Severity:** P0
**Why it breaks:** AI reads the JWT with `jwt.decode()` (or splits and base64-decodes it by hand) instead of `jwt.verify()`, or accepts any algorithm. Anyone can then forge a token.
**How to test:** Take a real token, change the payload (user ID or role), keep the old signature and call a protected endpoint. Also try a token with `"alg": "none"`.
**Pass:** 401 for both.
**Fix:** Verify the signature with a fixed list of algorithms; check `exp`, `iss` and `aud`.

### AUTH-002 · Reset links and one-time codes that live forever
**Severity:** P0
**Why it breaks:** AI stores reset tokens and OTPs without an expiry, doesn't delete them after use, or stores them in plain text.
**How to test:** Use a reset link twice; use one after 2 hours; enter 20 wrong codes in a row.
**Pass:** The second use fails, the expired link fails, and wrong codes lock or slow down after a few tries.
**Fix:** Random tokens stored hashed, reset links valid for an hour at most and codes for minutes, deleted on use, with an attempt limit.

### AUTH-003 · Sessions survive a password change
**Severity:** P1
**Why it breaks:** AI updates the password hash but leaves existing sessions and refresh tokens alive, so a thief stays logged in.
**How to test:** Log in on two devices, change or reset the password on one, keep using the other.
**Pass:** The other device is logged out.
**Fix:** Revoke refresh tokens (or bump a token version) on password change and reset.

### AUTH-004 · Logout that only deletes the cookie
**Severity:** P1
**Why it breaks:** The client forgets the token, but the refresh token is still valid on the server.
**How to test:** Log out, then send the old refresh token.
**Pass:** Rejected.
**Fix:** Revoke the session on the server at logout.

### AUTH-005 · Open redirect after login
**Severity:** P1
**Why it breaks:** AI sends the user to `?next=` or `returnUrl` as-is after login, so a phishing link can bounce users to another site.
**How to test:** Open `/login?next=https://example.org` and log in.
**Pass:** You stay on your own domain.
**Fix:** Accept only relative paths, or an allow-list of URLs.

### AUTH-006 · Login and reset reveal who has an account
**Severity:** P2
**Why it breaks:** "No account with this e-mail" on login, reset or signup lets anyone check who uses the app.
**How to test:** Request a reset for a registered and an unregistered e-mail; compare the message, status code and response time.
**Pass:** The same response for both, or a deliberate product decision to show it.
**Fix:** A generic message: "If an account exists, we sent you a link."

## Before launch

- [ ] `AUTH-007` **P1** E-mail (or phone) is verified before the account can pay, post or invite others
- [ ] `AUTH-008` **P1** OAuth sign-in checks the `state` parameter, and only your production redirect URIs are registered with the provider
