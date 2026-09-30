# Cloud and infrastructure

Only if the repo has deploy or cloud config: a `Dockerfile`, `docker-compose.*`, Terraform, or a cloud SDK.

### CLOUD-001 · Public storage bucket
**Severity:** P0
**Why it breaks:** To make images load, AI makes an S3, Google Cloud Storage or Azure Blob bucket public, and user uploads, exports or backups land in it too.
**How to test:** Check the bucket's public access settings (`aws s3api get-public-access-block --bucket <name>`, or the console); open the bucket URL in a logged-out browser.
**Pass:** Public access is blocked; private files are served through signed URLs or a CDN with access control.
**Fix:** Block public access and serve private files with short-lived signed URLs.

### CLOUD-002 · Over-privileged cloud keys
**Severity:** P0
**Why it breaks:** AI uses a root or admin key (`AdministratorAccess`, `"Action": "*"`) in the app because it "just works". One leak then gives away the whole account.
**How to test:** Look up the policies attached to the key the app uses.
**Pass:** Only the actions and resources the app needs; no root keys; a role instead of a long-lived key where the platform allows it.
**Fix:** A dedicated user or role with a scoped policy.

### CLOUD-003 · Secrets baked into Docker images
**Severity:** P0
**Why it breaks:** `COPY . .` copies `.env` into the image, or the Dockerfile sets secrets with `ENV` or `ARG`. Anyone who can pull the image can read them (`docker history`).
**How to test:** Check that `.dockerignore` lists `.env*`; search the Dockerfile for `ENV` and `ARG` lines with secret-like names.
**Pass:** No secrets in the image; they arrive at runtime.
**Fix:** `.dockerignore`, runtime environment variables or a secret store, BuildKit secrets for build-time values.

### CLOUD-004 · Database or internal services open to the internet
**Severity:** P0
**Why it breaks:** To connect from a laptop, AI opens the database port to `0.0.0.0/0`, or `docker-compose` publishes Postgres, Redis or an admin panel (pgAdmin, phpMyAdmin) on the server's public interface.
**How to test:** Read the firewall or security group rules and the `ports:` in `docker-compose` files; try to connect from outside.
**Pass:** Databases, caches and admin panels are reachable only from the app's network or a VPN.
**Fix:** Close the ports; bind to `127.0.0.1` or a private network; use a VPN or SSH tunnel for admin access.

### CLOUD-005 · Containers running as root
**Severity:** P1
**Why it breaks:** The Dockerfile has no `USER`, so a bug in the app runs with root inside the container.
**How to test:** Look for a `USER` line in every Dockerfile.
**Pass:** The app runs as a non-root user.
**Fix:** Create a user in the image and switch to it with `USER`.

### CLOUD-011 · Things that run out silently
**Severity:** P1
**Why it breaks:** Production depends on limits nobody watches: a prepaid AI or API balance, a token or password that expires or is revoked, a free trial, the card behind the CI or hosting account, a time-limited database edition, one personal account that owns the integration (locked for "unusual activity"), and the server disk (database logs with no log backups, old build folders). When one runs out, features fail with a polite fallback message and nobody is told.
**How to test:** List every paid or credentialed dependency with owner account, admins, expiry date, balance and billing contact. Revoke one key in staging and see who is alerted. Check free disk on every server, each database's recovery model and last log backup.
**Pass:** Balance, expiry and failed-payment alerts reach a technical owner; auth, quota and billing errors raise an alert (not just a log line); at least two admins per integration under a company account; a disk alert at 80%; at least one health check runs outside the CI provider.
**Fix:** Auto-recharge or low-balance alerts; calendar reminders 30 days before expiry; service tokens instead of personal ones; log backups or simple recovery; scheduled cleanup of build folders.

## Before launch

- [ ] `CLOUD-006` **P1** A billing budget alert exists in every cloud account the app uses
- [ ] `CLOUD-007` **P1** The root / owner account has MFA and isn't used for daily work
- [ ] `CLOUD-008` **P1** Backups and logs are stored off the server they come from
- [ ] `CLOUD-009` **P2** Base images are pinned to a version and scanned for vulnerabilities (Docker Scout or Trivy)
- [ ] `CLOUD-010` **P2** The setup can be rebuilt from code or a written runbook (Terraform, Compose files, deploy docs)
