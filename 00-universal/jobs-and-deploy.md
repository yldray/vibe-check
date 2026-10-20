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
**Why it breaks:** CI deploys every push to production without running the build or tests. Or tests and deploy are separate workflow files started by the same `push`: they run in parallel, `needs:` can't link two workflows, and a fast deploy is live minutes before the tests turn red. The deploy also installs the branch tip (`git pull`, `reset --hard origin/main`) instead of the commit the tests ran on, an older run can finish after a newer one and deploy over it, and `continue-on-error: true` or `|| true` turns a failing test step green.
**How to test:** Read the deploy workflow. If tests and deploy are separate files, check what starts the deploy and which commit it installs. List every `continue-on-error: true` and `|| true` in test jobs.
**Pass:** Build and tests must pass before the deploy step starts. The green test run starts the deploy and hands it the tested SHA; the deploy skips when the branch has already moved on; a skipped or failed validation fails the release instead of leaving a warning.
**Fix:** Make the deploy job depend on the test job (`needs: test` in GitHub Actions), or start a separate deploy workflow from `workflow_run` with `github.event.workflow_run.conclusion == 'success'` (or call it with `workflow_call`). Deploy `github.event.workflow_run.head_sha` or `github.sha`, never the branch tip. Remove `continue-on-error` from test steps.

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
**Why it breaks:** AI writes and tests on macOS or PowerShell 7; production is Windows PowerShell 5.1, a different shell or a different OS. Non-ASCII characters (em dashes, local letters) in a BOM-less script break parsing, StrictMode and null handling differ, a CLI waits for a hidden prompt, `robocopy` success codes 1–7 look like failures, CRLF checkouts break text comparisons, console encoding crashes a job on a local character, a temp file stays locked, a route works locally but sits under a virtual directory in production. The job also runs as another account: a scheduled task, service, CI runner or cron job runs as SYSTEM, a service account or `www-data`, with a different `PATH`, no user profile and no credentials, so a bare `python` finds another interpreter (on Windows the Store alias, which hangs), relative paths resolve against `System32` or `/`, git waits for a password prompt nobody sees, and a non-admin runner gets "access denied" reading system config, which a diagnostic reports as "not installed". A 32-bit Windows PowerShell sees `System32` redirected to `SysWOW64`, so 64-bit paths such as `inetsrv\config` "don't exist". Windows PowerShell 5.1 has its own traps: an array splat (`& script.ps1 @args`) can bind `-Flag` as a positional value; `2>&1` on a native command under `$ErrorActionPreference = 'Stop'` throws on the first stderr line; `Out-File -Encoding utf8` writes a BOM, so the first key in `$GITHUB_OUTPUT` isn't found; `$null` passed to a .NET string parameter arrives as `""`. Every bug surfaces mid-deploy on the live server.
**How to test:** Run every deploy script and scheduled job end to end on the exact target shell and OS (a VM or a CI runner of that OS) with real input, `-NonInteractive` and strict mode, before it touches production. Start each scheduled task or service through the scheduler itself (`Start-ScheduledTask`, `systemctl start`, a test job on the runner) and read its exit code and log; print `whoami`, `[Environment]::Is64BitProcess` and `Get-Command python` (or `which`) in the job. Grep task and unit definitions for bare interpreter names and relative paths.
**Pass:** Same output on the target OS and under the account that really runs it; every failure exits non-zero; no non-ASCII bytes in scripts for Windows PowerShell 5.1; a check that can't read something reports "unknown" and fails.
**Fix:** Add the production OS to CI; keep scripts ASCII (or UTF-8 with BOM) for PowerShell 5.1; judge native commands by exit code; `.gitattributes` for line endings; set UTF-8 output explicitly; absolute interpreter paths inside the project's runtime, an explicit working directory and env file, `GIT_TERMINAL_PROMPT=0`, stdout and stderr to a log file; `%windir%\Sysnative` from 32-bit shells; hashtable splats; `[NullString]::Value` for a null string argument.

### OPS-017 · Code shipped before what it depends on
**Severity:** P1
**Why it breaks:** AI deploys code as soon as it compiles: the table, column or schema it reads isn't in production yet; the secret file or env var doesn't exist on the server; the mobile build calls endpoints the production API doesn't have; the frontend needs a field the backend hasn't shipped. Worse, a rule engine that finds no config fails open, so the missing table quietly lifts every rule.
**How to test:** For each change, list what must exist first (migrations, config keys, API fields, other services). Deploy in the wrong order in staging. Before submitting an app build, call each new endpoint on production.
**Pass:** Deploy notes state the order; new code degrades clearly (or refuses to start, naming what is missing) when a dependency is absent.
**Fix:** Deploy schema and backend first, then clients; tolerant readers or feature flags; a startup check for required config; see `OPS-001`, `ENV-005`.

### OPS-018 · A rewrite drops what shipped clients still call
**Severity:** P0
**Why it breaks:** When a backend is rewritten or moved, AI ports the endpoints it finds in the new client code. Shipped mobile and TV apps that users haven't updated still call the old route names and send old fields. The missing endpoint returns 404 after the store has already charged the user, so no subscription is written; a missing field silently writes a 1970 date.
**How to test:** List every route and field called by every client version still in use (old backend code + client code + access logs) and call each one against the new backend.
**Pass:** Every route still answers with the same contract, or the old app version is blocked with an update prompt.
**Fix:** A contract list from access logs; aliases for old routes; a minimum-version gate before removing anything. See `OPS-017`.

### OPS-023 · A new model field takes down every query on its table
**Severity:** P0
**Why it breaks:** AI adds a property to an ORM model (EF Core entity, JPA entity, Prisma model, Django or SQLAlchemy model) for one small feature and leaves the column to a migration or a `.sql` file someone has to run by hand. The ORM now selects that column in every query on the table, so if the code reaches production before the column does, login, sign-up and everything else that reads the table fail with "Invalid column name" or "column does not exist", although only one admin screen uses the field. A green build and a `/health` that doesn't read the table won't notice.
**How to test:** For each changed model, list the new fields and check that each column exists in the production schema before deploying (`dotnet ef migrations list` marks unapplied ones `(Pending)`; `prisma migrate status`; `python manage.py showmigrations`; or query `INFORMATION_SCHEMA.COLUMNS`). Search the change for `.sql` files no pipeline runs. In staging, deploy the code without the schema change and log in.
**Pass:** The pipeline applies the schema change before the new code starts, and the deploy fails (and rolls back) when a mapped column is missing; a readiness check reads one row of each core table through the ORM.
**Fix:** Run migrations as a pipeline step that fails the deploy; add the column first and ship the code that reads it after; never leave a schema change as a file for someone to run by hand. See `OPS-001`, `OPS-006`, `OPS-017`.

### OPS-024 · An AI agent deploys its own changes
**Severity:** P1
**Why it breaks:** A coding agent picks up tickets, commits and triggers the production deploy itself (a `[deploy]` tag, auto-merge, a push to the release branch). Its own report says some acceptance criteria "could not be verified", the change includes a schema script for someone to run by hand, or it touches login or payments, and nothing stops the deploy because no person looks before production. It also reports "done" too early: the ticket closes and the requester is told the change is live although the deploy run was skipped or red, the site doesn't answer, or the change needs a manual step the deploy doesn't do (a production config file the copy excludes, a migration, a server script).
**How to test:** List every path from an agent's commit to production (CI triggers on bot authors, commit-message tags, auto-merge rules). For a recent agent change, check what the pipeline did with unverified criteria, new `.sql` or migration files, and changes under auth, payment or schema folders. Follow the ticket, not only the deploy: with the deploy run skipped, red, missing, or green while the live URL doesn't answer, the ticket stays open and the requester gets no "done". Change a file the deploy doesn't apply (`appsettings.Production.json`, `.env.example`, a migration, a workflow or server script) and check that it is flagged as a manual step.
**Pass:** An agent's change reaches production only after a person approves it, or after automated gates pass: migrations applied by the pipeline, a smoke test of login, sign-up and payment after the deploy with automatic rollback, and any "not verified" item blocks the deploy. The ticket closes and the requester hears "done" only after the deploy run succeeded, the live URL answers and a person confirmed every manual step. The agent's report ends with a manual-steps list ("none" is a valid answer) that code requires, not an editable prompt; a missing list counts as unverified.
**Fix:** Let agents open pull requests, not deploy; protect the release branch; require review for schema, auth and payment paths (`CODEOWNERS`); run the post-deploy checks of `OPS-021`; close the ticket from the deploy's success, not from the agent's report. See `OPS-005`, `OPS-023`.

## Before launch

- [ ] `OPS-007` **P1** Long work (e-mails, exports, AI calls, image processing) runs in a queue, not inside the request
- [ ] `OPS-008` **P1** Schedules use UTC or an explicit time zone and survive daylight-saving changes; the server's OS time zone is set on purpose by the setup script, and every stored timestamp is UTC (or carries its offset) instead of a mix of UTC and naive local `now()`. Test: read the zone on each server (`tzutil /g`, `timedatectl`); grep server code for `DateTime.Now`, `datetime.now()`, `date.today()` that are stored or used for "today", and check that "today" and validity checks use the business time zone explicitly (Windows Task Scheduler: see `WIN-005`; display: see `UNI-026`)
- [ ] `OPS-009` **P1** CI logs never print secrets (no `set -x` around them, no `echo $TOKEN`)

## CI workflows (GitHub Actions)

AI writes these by copying snippets. Check every file in `.github/workflows/`.

- [ ] `OPS-010` **P0** No `pull_request_target` workflow checks out or runs code from the pull request: a fork's PR would run with your secrets and a write token
- [ ] `OPS-011` **P0** No `${{ github.event.* }}` (PR title, issue body, branch name, commit message), `${{ inputs.* }}` (including "type deploy to confirm" inputs), `${{ steps.*.outputs.* }}` or `${{ needs.* }}` value is written straight into a `run:` script; pass it through `env:`, quote the variable and validate its format (`grep -n '${{' .github/workflows/*.yml` inside `run:` blocks)
- [ ] `OPS-012` **P1** Every workflow sets `permissions:` to the least it needs (e.g. `contents: read`), never `write-all`
- [ ] `OPS-013` **P2** Third-party actions are pinned to a full commit SHA, not a moving tag like `@v1` or `@main`; tools a workflow downloads with `curl` or `wget` are checked against a pinned SHA-256 before they run
- [ ] `OPS-014` **P2** Every job has `timeout-minutes`, so a stuck job doesn't burn runner minutes for hours
- [ ] `OPS-025` **P1** Self-hosted runners: every deploy job names its own label (`runs-on: [self-hosted, <app>]`), because plain `self-hosted` lets any runner registered to the repo or organization take the job, such as another app's runner on the same server, which deploys with its own account and folders; deploy jobs run only from the release branch (`if: github.ref == 'refs/heads/main'`, or an environment limited to `main`), because `workflow_dispatch` lets anyone with write access run any branch; runners update themselves, because a runner registered with `--disableupdate` that misses a release for 30 days, or falls below GitHub's minimum version, gets no jobs and the deploy sits queued. Test: `grep -nE "runs-on:\s*\[?\s*self-hosted\s*\]?\s*$" .github/workflows/*.yml`; check each deploy job for a branch condition; compare the runner version pinned in setup scripts with the current release and check that runners show Idle under Settings → Actions → Runners (see `OPS-013`, `OPS-015`)

## Found in production

- [ ] `OPS-019` **P1** Nothing the app writes at runtime (toggles, uploaded JSON, generated files) lives inside the deploy folder; the next deploy would wipe it
- [ ] `OPS-020` **P1** Commits pushed by a workflow with `GITHUB_TOKEN` don't start other workflows; if a bot commit must deploy, the workflow triggers the deploy itself or uses a token that can
- [ ] `OPS-021` **P1** After every deploy a business number is checked (payments, sign-ups, logins in the last hour), not only `/health`; between deploys a synthetic check logs in (and signs up) with a test account every few minutes and alerts, because a `/health` that doesn't read the users table stays green while every login fails
- [ ] `OPS-022` **P1** Jobs registered at app start (Hangfire `AddOrUpdate`, cron libraries) come back after you delete them in the dashboard; stopping one for good removes it in code
