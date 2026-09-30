# AI code pitfalls

Bugs that AI coding tools produce again and again, regardless of stack.

### UNI-001 · Hardcoded secrets
**Severity:** P0
**Why it breaks:** AI puts keys in code "to make it work", and not only in `.env`: data migrations and seed files, deploy and setup scripts (`*.ps1`, `*.sh`), CI workflow files, `gradle.properties` and keystores, committed base config (`appsettings.json`, `Web.config`), AI context files (`CLAUDE.md`, `AGENTS.md`, `.cursorrules`), generated reports, and ready-to-paste commands with the password inline (`-P '…'`, `https://user:TOKEN@host/repo.git`) that end up in chat, shell history and the process list.
**How to test:** Run `gitleaks detect --redact` (scans files and git history without printing the values), then grep migrations, seeds, `scripts/`, `deploy/`, `.github/workflows/`, AI instruction files and `git ls-files` output (reports, exports, dumps) for `password|secret|key|token|Server=`. Check `~/.zsh_history` / `~/.bash_history` and `.git/config` remotes for inline credentials.
**Pass:** Zero findings.
**Fix:** Move to env variables or a secret store; scripts read credentials from env or a prompt, never from arguments or URLs; rotate every key that was ever committed or pasted, even in a private repo.

### UNI-002 · Hallucinated packages
**Severity:** P0
**Why it breaks:** AI imports packages that don't exist. Attackers register those names (slopsquatting).
**How to test:** Check every new dependency on the registry: publisher, downloads, age.
**Pass:** Every package is real, maintained and the one you intended.
**Fix:** Remove and replace with a known package.

### UNI-003 · Auth disabled "for testing"
**Severity:** P0
**Why it breaks:** AI comments out auth middleware to fix an error, and it stays that way.
**How to test:** Call every endpoint without a token.
**Pass:** Protected endpoints return 401/403.
**Fix:** Restore middleware; add a test that fails without auth.

### UNI-004 · Broken object-level authorization (IDOR)
**Severity:** P0
**Why it breaks:** AI checks "is logged in" but not "owns this record".
**How to test:** Log in as user A, request user B's resource by ID.
**Pass:** 403 or 404.
**Fix:** Filter every query by the current user / tenant.

### UNI-005 · Client-side-only validation
**Severity:** P0
**Why it breaks:** AI validates the form in the UI and trusts the API input.
**How to test:** Send invalid data directly with curl / Postman.
**Pass:** API rejects it.
**Fix:** Validate on the server with a schema (Zod, FluentValidation, Pydantic, etc.).

### UNI-006 · Mock data left in production
**Severity:** P0
**Why it breaks:** Fake users, sample products or `if (DEV)` shortcuts survive. So do whole fake implementations whose names don't say "mock": a log-only e-mail or OTP sender registered in production, a dummy AI service used when the key is missing, an "upgrade" endpoint that grants premium without payment, a "watch ad" reward with no ad SDK, stock photos from image placeholder services, the template splash screen and icon, and a `localhost` API override or demo-data flag in the release build.
**How to test:** Search for `mock`, `fake`, `dummy`, `demo`, `simulat`, `lorem`, `TODO`, `FIXME`, `test@`, `example.com`, `picsum`, `pravatar`, `placeholder`, `localhost`. List the production DI registrations (`(Log|Dummy|Fake|Null|InMemory|Console)` implementations). Send one real e-mail, SMS and AI call from production; call every reward and upgrade endpoint with a normal user token.
**Pass:** Nothing in production code paths.
**Fix:** Remove or move to seed / test files; register fakes only in development; a missing provider key fails startup instead of falling back; paid or rewarded state changes only from a verified purchase or ad callback.

### UNI-007 · Swallowed errors
**Severity:** P1
**Why it breaks:** `try { ... } catch {}` hides failures; the user sees success.
**How to test:** Search for empty catch blocks; force a failure (kill the DB).
**Pass:** Error is logged and the user sees a real error.
**Fix:** Log + rethrow or return a proper error.

### UNI-008 · Tests that test nothing
**Severity:** P1
**Why it breaks:** AI writes tests that mock everything or assert `true`. Or the tests never run: a test project outside the solution, a file not listed in an old-style project, `--no-build` running old binaries, tests that skip themselves when a fixture is missing, a branch that is behind main. Gating scripts like `build | grep error && push` exit 0 when they find the error.
**How to test:** Break the code on purpose (or revert the fix); run the exact command CI and the README use. Compare the test and skip counts before and after the change.
**Pass:** At least one test fails; the test count goes up with new tests; no critical test skips on the release job; the gate fails on a compile error.
**Fix:** Assert real outputs; mock only external services; always build before testing; gate on the build's own exit code (`set -euo pipefail`, no pipes into grep); treat skips on release pipelines as failures.

### UNI-009 · Outdated API usage
**Severity:** P1
**Why it breaks:** AI uses deprecated APIs from its training data.
**How to test:** Check build warnings and the library's current docs.
**Pass:** No deprecation warnings.
**Fix:** Migrate to the current API.

### UNI-010 · No pagination
**Severity:** P1
**Why it breaks:** AI returns `SELECT *` for lists. Works with 10 rows, dies with 100k.
**How to test:** Seed 10k rows, call the list endpoint.
**Pass:** Response is paginated and fast.
**Fix:** Add limit/offset or cursor pagination.

### UNI-011 · Duplicated logic
**Severity:** P1
**Why it breaks:** AI rewrites the same helper in multiple files; fixes land in only one. The costly copies are status sets, thresholds, prices and permission lists, "is this item eligible" checks shared by a list and the action behind it, and the same write reached through several paths (main form, bulk import, admin shortcut, retry job, legacy API, direct SQL) where only one runs the validation and side effects. The client also keeps its own copy of server data: hardcoded ID lists, prices computed in the UI, a score the server stored differently.
**How to test:** Search for similar function names / blocks, repeated literal arrays and numbers (status lists, thresholds, prices) across client, server and SQL. List every code path that writes the core tables and run the same invalid input through each. Check that items a list shows as ready succeed when you run the action.
**Pass:** One source of truth.
**Fix:** Extract a shared module; one domain function per action that every entry point calls; constants defined once on the server and sent to clients; the client displays, the server decides.

### UNI-012 · Check-then-insert race
**Severity:** P1
**Why it breaks:** AI checks first ("is the slot free?", "is there stock?", "was this coupon used?") and writes in a second step. Two requests at the same moment both pass the check: double bookings, overselling, a coupon used twice, duplicate accounts.
**How to test:** Send the same request 20 times in parallel (e.g. `seq 20 | xargs -P 20 -I{} curl ...`, or k6) against booking, checkout, coupon and signup endpoints. For background queues, start the job twice at the same moment; kill a run mid-way and restart it.
**Pass:** Exactly one succeeds; the others get a clear error.
**Fix:** Let the database decide: a unique constraint, an atomic update (`UPDATE ... SET stock = stock - 1 WHERE stock > 0`) or a transaction with locking. An app-level check alone is not enough. Queues claim rows in one statement (`FOR UPDATE SKIP LOCKED`, `UPDATE … OUTPUT` with `READPAST`); "running" flags are leases with an expiry, so a crash doesn't block every later run.

### UNI-013 · "Done" without the effect
**Severity:** P0
**Why it breaks:** AI sets the status from intent, not from the result. A job marks a row "sent", "applied" or "approved" when the write was skipped, the HTTP call returned 4xx/5xx (`fetch` doesn't throw), or a stub returned `true` without calling anything. New statuses and error branches never appear on any screen or counter, so the items sit there forever. Whole features ship, compile and pass tests, but the one call that triggers them from the real flow is missing, so they never run once.
**How to test:** For every terminal status, write a reconciliation query: status = done AND the real effect (row, external record, e-mail log) is missing. Run `SELECT status, COUNT(*) … GROUP BY status` and name the screen, counter and job that handles each value. For every feature in the release, count its success events or rows a few days after launch. Make the downstream call return 400/429/500 and check the status.
**Pass:** The reconciliation query returns 0; every status has a screen and an exit; every shipped feature has a non-zero success count or an explained zero; failed calls leave the item retryable.
**Fix:** Set "done" only from the confirmed result (check `response.ok`, read the record back); give skipped work its own status with a reason; emit one success event per feature and check it after release; alert when rows sit in a non-final status too long.

### UNI-014 · Save overwrites fields it didn't show
**Severity:** P0
**Why it breaks:** AI maps the whole DTO onto the entity. A bulk action, second screen or wizard step sends only some fields, and the missing ones are written as `null`, `""`, `0` or `false` (non-nullable types), erasing real data. Variants: the save handler reads another form's control, an input has no `name` or binding, the target record is taken from "current selection" at save time instead of the ID the form opened with, a button payload hardcodes a flag its label doesn't mention, a bulk action handles only the first selected row. The usual "ignore blanks" fix then makes clearing a field impossible.
**How to test:** For every edit form, fill every field with distinctive values, save, reload from the server and compare field by field. Send each update endpoint one changed field and diff the full row. Open record A in two tabs, switch to B in one, save in the other. Log each action's payload and compare it with the button label; run bulk actions on 3+ rows.
**Pass:** Only the fields the user changed change, on the record that was loaded; clearing needs an explicit signal and works; bulk actions affect exactly the selected rows.
**Fix:** PATCH semantics or load-then-merge on the server; nullable DTO fields; carry the record ID in the form; one endpoint per intent; a round-trip test per form.

### UNI-015 · Safety checks that don't stop anything
**Severity:** P0
**Why it breaks:** AI writes checks as "block if something bad is found". When the lookup fails (403, timeout, locked DB, first page only), the list is empty, so the check passes. An allowlist that isn't configured allows everyone; an empty rules table lifts every rule; a read error on the user store falls back to the setup admin. Kill switches, dry-run flags and daily caps exist in settings but only one code path reads them, so a job, an admin endpoint or a retry path writes anyway. An admin-editable setting accepts a value that disables the check.
**How to test:** For every auth, limit, approval and deploy-trust check, force its dependency to fail (revoke the token scope, block the host, delete or lock the DB, empty the config table, put the failing item on page 2). Turn on each kill switch / dry-run / cap = 0 and run every job and endpoint that writes the protected data, then count real writes. Grep each setting key for a reader.
**Pass:** Unknown or missing input blocks the action with a reason; every path obeys every switch; every setting has a reader; invalid settings are rejected on save.
**Fix:** Model pass / fail / unknown and treat unknown as fail; paginate to the end; enforce switches in the one function every write goes through; validate settings against a schema; keep safety gates out of the admin-editable set.

### UNI-016 · A guess instead of "unknown"
**Severity:** P0
**Why it breaks:** AI prefers to always return something: `ISNULL(confirmed, suggested)`, `?? default`, `x || 15`, `MAX(...)` over duplicate rows, a catch-all "general" record, or "if the filtered list is empty, use the unfiltered one". It also invents plausible numbers (a default rate, a threshold, a cap) that no requirement mentions. The output looks normal, so wrong money or data flows downstream, sometimes into another customer's scope.
**How to test:** For each lookup that feeds money, permissions or another system, feed it: no match, two matches, an unconfirmed suggestion, a legitimate `0`, an empty scope. Grep for `ISNULL(`, `COALESCE(`, `??`, `|| <number>`, `MAX(`, `TOP 1` / `FirstOrDefault` without an order, and code that replaces an empty filtered list. List numeric literals in business logic and ask where each comes from.
**Pass:** Missing or ambiguous input stops that item with a visible reason; `0` stays `0`; an empty scope means "no match"; every threshold has a documented source and lives in config.
**Fix:** Return "unresolved" and route to a human queue; use only confirmed mappings; add unique constraints so duplicates can't exist; use null-only defaults (`??`), never `||`, for numbers.

### UNI-017 · New SQL never run on production-shaped data
**Severity:** P0
**Why it breaks:** SQL inside strings is invisible to the compiler, so the build is green. The typo, reserved word used as an alias, wrong column, unsupported function at the production compatibility level, value longer than its column, missing schema prefix, or `LIKE` with unescaped `[`, `_`, `%` fails only when that line runs in production, often inside a job or a catch nobody reads. A query measured on a near-empty dev table (so `EXISTS` short-circuits) runs once per row on production and times out, and the screen shows zeros instead of an error.
**How to test:** Run every new or changed query and script once against a copy of the production schema and a production-sized dataset (or a read replica) before deploy; record errors, duration and the command timeout. Include rollback and diagnostic scripts. Make the endpoint time out and see what the UI shows.
**Pass:** Every changed query has run on real schema and volume, well under half its timeout; a timeout shows an error state, never an empty or zero result.
**Fix:** An integration test or CI step that executes each query against a schema copy; pre-aggregate with joins/CTEs instead of per-row subqueries; typed parameters; escape `LIKE` input or use `=`.

### UNI-018 · Leftovers from another app, the dev DB or an old server
**Severity:** P1
**Why it breaks:** AI copies values it sees at hand: user, role, company or plan IDs from the dev database; an ID range that was true when written ("paid plans are below N"), so new records are silently excluded from billing or rules; another app's store ID, domain, brand name or password-reset host after cloning a project; `localhost` as the base URL for share previews; a test domain in production config; an old server IP, absolute home-directory paths and committed bundles with an old API URL.
**How to test:** Grep code, config, SQL scripts and built bundles for numeric ID literals in conditions, ID ranges, old project names, domains, IPs, `localhost`, other bundle IDs and absolute paths. Share a production link in a messenger and check the preview.
**Pass:** Rules select by properties, not ID values; zero hits for old names and hosts outside docs; production config references only production hosts.
**Fix:** Look IDs up by stable code or name; select by record properties; add old names and hosts to a CI grep that fails the build; base URLs from production env vars.

### UNI-019 · Deleted and deactivated records still show up
**Severity:** P1
**Why it breaks:** AI adds `IsDeleted`, `IsActive` or `deleted_at` and filters on it in the query it is editing, not in joined tables or sibling queries. A deleted account still counts in the "e-mail exists?" check, so the user can't sign up again; a deactivated user keeps receiving report e-mails; inactive prices still show; a list and the action behind its button use different filters. "Suspended" and "deleted" are also mixed up in business rules.
**How to test:** Soft-delete or deactivate a record and a user, then run every list, search, exists check, export, report e-mail, login and signup. Grep queries on the table for the flag on every join.
**Pass:** Inactive data is invisible everywhere except admin and audit views; deactivated users get nothing and can't log in; "active" is computed the same way everywhere.
**Fix:** A global query filter (e.g. EF `HasQueryFilter`) or a view; one shared predicate for list and action; separate flags for suspended and deleted.

### UNI-020 · Identifiers compared raw, matched on non-unique keys
**Severity:** P1
**Why it breaks:** AI treats numeric-looking IDs (tax number, phone, national ID, invoice number) as numbers or trims them differently in each query: leading zeros vanish, a pasted tab or space survives, case differs, a blank value joins millions of blank rows. It also matches on whatever looks identifying: date + name instead of the record ID, a document number that is only unique per issuer, an upstream row ID that is replaced on renewal, a masked or placeholder value shared by thousands of people. Records are silently skipped, duplicated or attached to the wrong person.
**How to test:** Build fixtures with leading zeros, tabs, non-breaking spaces, mixed case, blanks, masked and max-length values; run them through import, lookup and join. For each key used to update, skip or link, count duplicates in production (`GROUP BY key HAVING COUNT(*) > 1`).
**Pass:** All variants resolve to one entity; blanks and masks never match; keys that decide writes are backed by a unique index.
**Fix:** Store IDs as strings; one normalize function used on write and on lookup; store unknown as `NULL`, not text; carry the primary key through the flow; composite unique keys (e.g. issuer + number).

### UNI-021 · Multi-step writes that stop halfway
**Severity:** P1
**Why it breaks:** AI writes table A, then table B, and swallows the error when B fails, so A exists without B. It sends the SMS or calls the partner API inside the open transaction: a slow service holds locks, a failure rolls back data that was already correct, or the customer is told about a change that was rolled back. A fetcher deletes the source e-mail or file before its copy is saved. A group write checks "already done?" on the first item only.
**How to test:** Force the second step to fail (bad value, too-long string, DB stopped) and inspect every table; time out the external call; make the save fail after a fetch. For group writes check every member.
**Pass:** Either all steps land or none, and the user sees the error; external calls happen after commit with a timeout; the source is removed only after the copy is committed.
**Fix:** One transaction per business action; an outbox (or "commit, then send"); explicit timeouts; move, don't hard-delete, sources; idempotent re-reads by message ID.
