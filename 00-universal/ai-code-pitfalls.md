# AI code pitfalls

Bugs that AI coding tools produce again and again, regardless of stack.

### UNI-001 · Hardcoded secrets
**Severity:** P0
**Why it breaks:** AI puts API keys directly in code "to make it work".
**How to test:** Run `gitleaks detect --redact` (scans files and git history without printing the values).
**Pass:** Zero findings.
**Fix:** Move to env variables, rotate every leaked key.

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
**Why it breaks:** Fake users, sample products or `if (DEV)` shortcuts survive.
**How to test:** Search for `mock`, `fake`, `dummy`, `demo`, `lorem`, `TODO`, `FIXME`, `test@`, `example.com`.
**Pass:** Nothing in production code paths.
**Fix:** Remove or move to seed / test files.

### UNI-007 · Swallowed errors
**Severity:** P1
**Why it breaks:** `try { ... } catch {}` hides failures; the user sees success.
**How to test:** Search for empty catch blocks; force a failure (kill the DB).
**Pass:** Error is logged and the user sees a real error.
**Fix:** Log + rethrow or return a proper error.

### UNI-008 · Tests that test nothing
**Severity:** P1
**Why it breaks:** AI writes tests that mock everything or assert `true`.
**How to test:** Break the code on purpose; run tests.
**Pass:** At least one test fails.
**Fix:** Assert real outputs; mock only external services.

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
**Severity:** P2
**Why it breaks:** AI rewrites the same helper in multiple files; fixes land in only one.
**How to test:** Search for similar function names / blocks.
**Pass:** One source of truth.
**Fix:** Extract a shared module.
