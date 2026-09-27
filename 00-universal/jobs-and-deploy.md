# Background jobs and deploys

Scheduled work, queues, migrations and the pipeline that ships them.

### OPS-001 · Migrations that break production
**Severity:** P0
**Why it breaks:** AI generates migrations, often with raw SQL, that run automatically on app start. A bad one takes the API down; a destructive one (drop or rename a column) breaks the version that is still running during the deploy.
**How to test:** Generate the SQL before deploying (`dotnet ef migrations script`, `prisma migrate diff`, `alembic upgrade head --sql`) and read it. Run the migrations on a copy of production data.
**Pass:** No destructive step without a fresh backup, and the old app version still works against the new schema.
**Fix:** Review the SQL before every deploy; expand, migrate, then contract (add first, remove later); take a backup first.

### OPS-002 · Cron runs on every instance
**Severity:** P1
**Why it breaks:** AI schedules jobs inside the web server (`setInterval`, `node-cron`, a hosted service, `@Scheduled`). With two instances every job runs twice: two e-mails, two charges.
**How to test:** Run two instances locally and count how often a job runs.
**Pass:** Once per schedule.
**Fix:** One scheduler: the platform's cron, a queue with a lock, or leader election.

### OPS-003 · Jobs that aren't safe to retry
**Severity:** P1
**Why it breaks:** A job times out after sending the e-mail or charging the card, retries, and does it again.
**How to test:** Kill the worker in the middle of a job and let it retry.
**Pass:** No duplicate side effects.
**Fix:** An idempotency key or an "already done" check per job.

### OPS-004 · Failed jobs vanish
**Severity:** P1
**Why it breaks:** No dead-letter queue, no failure log, no alert.
**How to test:** Make a job throw.
**Pass:** The failure is logged, visible and alerts someone.
**Fix:** A dead-letter queue (or failed-jobs table) plus an alert.

### OPS-005 · Deploys that skip tests
**Severity:** P1
**Why it breaks:** CI deploys every push to production without running the build or tests.
**How to test:** Read the deploy workflow.
**Pass:** Build and tests must pass before the deploy step starts.
**Fix:** Make the deploy job depend on the test job (`needs: test` in GitHub Actions).

### OPS-006 · Health check that never fails the deploy
**Severity:** P1
**Why it breaks:** The post-deploy check hits a page that doesn't exist in production, or only prints a warning.
**How to test:** Break the app in staging (wrong DB password) and deploy.
**Pass:** The deploy is marked failed, or rolled back.
**Fix:** Check a readiness endpoint that touches the database; fail the job on anything but 200.

## Before launch

- [ ] `OPS-007` **P1** Long work (e-mails, exports, AI calls, image processing) runs in a queue, not inside the request
- [ ] `OPS-008` **P1** Schedules use UTC or an explicit time zone and survive daylight-saving changes
- [ ] `OPS-009` **P1** CI logs never print secrets (no `set -x` around them, no `echo $TOKEN`)
