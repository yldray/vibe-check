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

### AUTH-009 · Backdoors left in the production login
**Severity:** P0
**Why it breaks:** To test login without an e-mail provider, or to get App Review past an OTP screen, AI adds a shortcut: a master code that works for any account, the code returned in the API response, a "forgot password" endpoint that sets a fixed password with no proof, or seed/demo accounts with a shared or guessable password. A config flag or nothing guards it, and it reaches production. Anyone who knows an e-mail address can log in as that user.
**How to test:** Request a code for an address you don't own and read the full response body. Grep code, config and seeds for `devCode`, `debugCode`, `bypass`, `fixed`, `master`, literal 4–6 digit codes and literal passwords. Call every reset endpoint without a valid code. List accounts in the production DB created by a seed, a script or the agent, and try the seed/README passwords on the live login.
**Pass:** No response contains a code; reset needs proof of ownership; no seed or default account can log in; a reviewer shortcut (if any) is one non-admin account, rate-limited, time-boxed, stored only in server settings, and off after approval.
**Fix:** Delete the shortcut or tie it to development builds only; refuse to start in production if a bypass setting is present; create the first admin with a one-time random password or invite link; for store review see `APPSTORE-002`.

### AUTH-010 · Account found by an unnormalized or shared phone or e-mail
**Severity:** P0
**Why it breaks:** AI writes `u.Phone == input` or `u.Email == input` with `FirstOrDefault()`. Stored values came from imports in other formats (spaces, dashes, country code) or other case, so real users can't reset their password. After normalizing, several accounts share one value (family members), and the reset or login lands on someone else's account. Legacy data often already holds several active rows per e-mail; `FirstOrDefault()` without `OrderBy` returns the oldest, so a subscriber logs into an old account with no subscription and hits the paywall. A flow that "identifies" a caller with two knowable facts and then writes their new phone or e-mail into the record lets anyone attach their channel to another person's account.
**How to test:** Try reset and login with the same phone in five formats and the same e-mail in different case. Count stored values shared by 2+ accounts after normalization. With a second test phone, identify as another test customer using only knowable facts and check whether your number is now on their record.
For an e-mail with 2+ rows, run login, one-time-code send and verify, social login and reset: all must pick the same row by one documented rule.
**Pass:** All formats find the same single account; a shared value is refused with a support path; a new contact channel is bound only after a code sent to the channel already on file.
**Fix:** Normalize on write and on lookup (digits only / E.164; lowercase e-mail), backfill, add a unique index where the field must be unique, treat "more than one match" as an error, and verify the existing channel before changing it.

### AUTH-011 · Role checks that aren't on the endpoint
**Severity:** P0
**Why it breaks:** AI protects admin actions with a list of URL prefixes in middleware (a new endpoint isn't in the list; a different case or trailing slash skips it), with a list of user IDs in the page's JavaScript while the API only checks "logged in", or with an invite / role-assignment endpoint that takes the target role from the request body. Realtime hubs (SignalR, Socket.IO) get none of the checks the REST controllers have.
**How to test:** Log in as the lowest role. Call every admin endpoint directly, also in upper case, with a trailing slash and URL-encoded. Call each invite and role endpoint with every higher role. Call hub methods from a script with a lower role and with the feature switched off.
**Pass:** 403 in every variant; nobody can grant a role equal to or above their own; hubs enforce the same rules as REST.
**Fix:** Put the policy on each endpoint or route group with a deny-by-default fallback; a server-side table of which role may grant which; one authorization service shared by controllers and hubs; UI lists only mirror server permissions.

### AUTH-012 · Refresh grace window that mints a token on every replay
**Severity:** P1
**Why it breaks:** So that two tabs can refresh at once, AI lets a just-rotated refresh token be used again for a few seconds, and every reuse issues another valid token in the same family. A stolen token replayed inside the window gets a working session, reuse detection never fires, and the real client's later rotations don't revoke the attacker's branch.
**How to test:** Send the same refresh token twice inside the grace window and count the active tokens in its family; then rotate the real client's branch and try the other token.
**Pass:** Both calls in the window get the same successor (or the second counts as reuse and revokes the family); a family never has more than one active token.
**Fix:** Store the successor on the rotated token and return it for replays inside the window; any replay after the window revokes the whole family. See `SEC-009`.

### AUTH-013 · A removed role keeps working until the user logs out
**Severity:** P1
**Why it breaks:** The role sits inside a long-lived access token, and removing it in the admin panel revokes nothing. A demoted admin keeps admin rights until the token expires or they log out, and the panel tells admins to "ask the user to log in again".
**How to test:** Log in as an admin in one browser, remove the role in another, then call an admin endpoint at once and again after a token refresh.
**Pass:** Refused within seconds.
**Fix:** Check the role on the server for sensitive actions, or revoke the user's refresh tokens (bump a token version) on every role change and keep access tokens short. See `AUTH-003`.

### AUTH-014 · Public pages that send visitors to the login page
**Severity:** P1
**Why it breaks:** A global HTTP interceptor redirects to login on any 401. On a public page or a free preview, a side request (saving progress, loading captions, fetching a profile) returns 401 and throws the visitor out mid-way; or the root URL itself is the login page, so a shared link looks as if sign-up is required.
**How to test:** In a private window, open the root URL and every marketing link; play a free preview to the end, seek and turn on captions; watch the network tab for 401s.
**Pass:** Visitors stay on public pages; requests that need a user are skipped for visitors, and only an action that needs an account asks them to log in.
**Fix:** Redirect on 401 only for requests the user started on a protected page; don't call user endpoints for anonymous visitors; make the root URL the public home.

## Before launch

- [ ] `AUTH-007` **P1** E-mail (or phone) is verified before the account can pay, post or invite others
- [ ] `AUTH-008` **P1** OAuth sign-in checks the `state` parameter, and only your production redirect URIs are registered with the provider
- [ ] `AUTH-015` **P2** The expiry a code or link states in the e-mail, SMS or screen ("valid for 5 minutes") comes from the same setting the server enforces
