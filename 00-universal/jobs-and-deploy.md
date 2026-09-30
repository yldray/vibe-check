# Background jobs and deploys

Scheduled work, queues, migrations and the pipeline that ships them.

### OPS-001 · Migrations that break production
**Severity:** P0
**Why it breaks:** AI generates migrations, often with raw SQL, that run automatically on app start. A bad one takes the API down; a destructive one (drop or rename a column) breaks the version that is still running during the deploy.
**How to test:** Generate the SQL before deploying (`dotnet ef migrations script`, `prisma migrate diff`, `alembic upgrade head --sql`) and look for: unescaped quotes inside string literals; new unique indexes or checks (run the matching `GROUP BY … HAVING COUNT(*) > 1` / `WHERE NOT (…)` on production data first); renames, NOT NULL or enum changes with no `UPDATE` for existing rows; hard-coded schema names. Generate a probe migration on a clean branch: it must be empty. Apply to an empty DB and to a copy of production, then read every existing row through the app. Grep startup code for `EnsureDeleted`, `DROP DATABASE`, `sync({force:true})` and for ALTERs or `Migrate()` inside an empty catch.
**Pass:** No destructive step without a fresh backup, and the old app version still works against the new schema.
**Fix:** Review the SQL before every deploy; expand, migrate, then contract (add first, remove later); move data in the same migration before adding constraints; one transaction plus a tested rollback script for hand-written SQL; fail hard on migration errors; take a backup first.

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
**Why it breaks:** No dead-letter queue, no failure log, no alert. Or the "alert" is a row in a table no human reads, a console log that a service manager discards, an alarm that fires every minute until people ignore it, or one that closes itself before anyone sees it. Jobs also stop without throwing: a scheduler inside the web app sleeps when the host idles the app pool, a scheduler is documented but never installed, a worker dies and isn't restarted, a job manually disabled after an incident is re-registered by startup code on every deploy.
**How to test:** Make a job throw; stop the worker for 20 minutes at night; after a deploy, send no traffic and check that scheduled jobs still run; disable a job and redeploy. For every job compare "last successful run" with its schedule and follow each alert until a person is notified.
**Pass:** The failure is logged, visible and alerts someone within ~15 minutes through a channel people read; alerts stay until acknowledged; every job has a last-success age with an alert; disabled jobs stay disabled.
**Fix:** A dead-letter queue (or failed-jobs table) plus an alert; a heartbeat checked from outside the worker (dead-man switch); a real logger with a file or remote sink; host schedulers in a service or keep the app always running; keep job on/off state in config, not in startup code.

### OPS-005 · Deploys that skip tests
**Severity:** P1
**Why it breaks:** CI deploys every push to production without running the build or tests.
**How to test:** Read the deploy workflow.
**Pass:** Build and tests must pass before the deploy step starts.
**Fix:** Make the deploy job depend on the test job (`needs: test` in GitHub Actions).

### OPS-006 · Health check that never fails the deploy
**Severity:** P1
**Why it breaks:** The post-deploy check hits a page that doesn't exist in production, or only prints a warning. Or it checks the wrong thing: the API's `/health` while the web app serves nothing, `127.0.0.1` without a Host header on a shared server, a "start service" command that reports success without the app coming up. Meanwhile the deploy stops the live app first, builds or copies over it in place (locked files, a failed copy leaves it down), kills every process with the same name on a shared host, and has no previous version to switch back to.
**How to test:** Break the app in staging (wrong DB password), then separately ship an empty web build, and deploy each. Run a request every second during a normal deploy and count failures.
**Pass:** The deploy is marked failed, or rolled back.
**Fix:** Check a readiness endpoint that touches the database and load each public hostname with its Host header; fail the job on anything else. Build in CI, copy each release to its own folder, switch when healthy, keep the last few releases, stop only the process you own.

### OPS-015 · Deploy is green, production runs other code
**Severity:** P0
**Why it breaks:** The pipeline is "green" but nothing new is live: the deploy job was skipped by an unset gate variable or a missing commit-message tag, it sits queued with no runner, the artifact step dropped hidden folders (`.next`), a manual copy left out new files, or a second hostname, site or slot still runs an old build. A security fix that reaches only one host is still exploitable on the other.
**How to test:** List every hostname, site, slot and container that serves the app, and every client's base URL. After a deploy, read a version endpoint (build commit) on each and compare it with the commit you pushed. Treat a "skipped" or "queued" deploy run as failed. Build the pushed commit from a clean clone.
**Pass:** Every host reports the pushed commit or is shut down; a clean clone builds and starts; every push to the release branch ends in a deploy run that ran.
**Fix:** Stamp the commit into every build and expose it; fail the deploy when the live version doesn't match; deploy all hosts from one pipeline or remove stale ones; build in CI from a clean checkout of main, never from a laptop or with manual edits on the server.

### OPS-016 · Scripts and jobs never run on the production OS
**Severity:** P1
**Why it breaks:** AI writes and tests on macOS or PowerShell 7; production is Windows PowerShell 5.1, a different shell or a different OS. Non-ASCII characters (em dashes, local letters) in a BOM-less script break parsing, StrictMode and null handling differ, a CLI waits for a hidden prompt, `robocopy` success codes 1–7 look like failures, CRLF checkouts break text comparisons, console encoding crashes a job on a local character, a temp file stays locked, a route works locally but sits under a virtual directory in production. Every bug surfaces mid-deploy on the live server.
**How to test:** Run every deploy script and scheduled job end to end on the exact target shell and OS (a VM or a CI runner of that OS) with real input, `-NonInteractive` and strict mode, before it touches production.
**Pass:** Same output on the target OS; every failure exits non-zero; no non-ASCII bytes in scripts for Windows PowerShell 5.1.
**Fix:** Add the production OS to CI; keep scripts ASCII (or UTF-8 with BOM) for PowerShell 5.1; judge native commands by exit code; `.gitattributes` for line endings; set UTF-8 output explicitly.

### OPS-017 · Code shipped before what it depends on
**Severity:** P1
**Why it breaks:** AI deploys code as soon as it compiles: the table, column or schema it reads isn't in production yet; the secret file or env var doesn't exist on the server; the mobile build calls endpoints the production API doesn't have; the frontend needs a field the backend hasn't shipped. Worse, a rule engine that finds no config fails open, so the missing table quietly lifts every rule.
**How to test:** For each change, list what must exist first (migrations, config keys, API fields, other services). Deploy in the wrong order in staging. Before submitting an app build, call each new endpoint on production.
**Pass:** Deploy notes state the order; new code degrades clearly (or refuses to start, naming what is missing) when a dependency is absent.
**Fix:** Deploy schema and backend first, then clients; tolerant readers or feature flags; a startup check for required config; see `OPS-001`, `ENV-005`.

## Before launch

- [ ] `OPS-007` **P1** Long work (e-mails, exports, AI calls, image processing) runs in a queue, not inside the request
- [ ] `OPS-008` **P1** Schedules use UTC or an explicit time zone and survive daylight-saving changes
- [ ] `OPS-009` **P1** CI logs never print secrets (no `set -x` around them, no `echo $TOKEN`)

## CI workflows (GitHub Actions)

AI writes these by copying snippets. Check every file in `.github/workflows/`.

- [ ] `OPS-010` **P0** No `pull_request_target` workflow checks out or runs code from the pull request: a fork's PR would run with your secrets and a write token
- [ ] `OPS-011` **P0** No `${{ github.event.* }}` (PR title, issue body, branch name, commit message), `${{ inputs.* }}` (including "type deploy to confirm" inputs), `${{ steps.*.outputs.* }}` or `${{ needs.* }}` value is written straight into a `run:` script; pass it through `env:`, quote the variable and validate its format (`grep -n '${{' .github/workflows/*.yml` inside `run:` blocks)
- [ ] `OPS-012` **P1** Every workflow sets `permissions:` to the least it needs (e.g. `contents: read`), never `write-all`
- [ ] `OPS-013` **P2** Third-party actions are pinned to a full commit SHA, not a moving tag like `@v1` or `@main`
- [ ] `OPS-014` **P2** Every job has `timeout-minutes`, so a stuck job doesn't burn runner minutes for hours
