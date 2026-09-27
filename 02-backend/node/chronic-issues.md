# Node.js — chronic issues

### NODE-001 · Unhandled promise rejection
**Severity:** P0
**Why it breaks:** Async route handlers without error handling crash the process or hang the request.
**How to test:** Force a DB error inside an async route.
**Pass:** Request gets a 500; process stays up.
**Fix:** Global error middleware + async wrapper, or Express 5 / Fastify.

### NODE-002 · Blocking the event loop
**Severity:** P1
**Why it breaks:** Sync crypto, `fs.*Sync`, big JSON parse or heavy loops in request handlers.
**How to test:** Load test one heavy endpoint and watch latency of a light one.
**Pass:** Light endpoints stay fast.
**Fix:** Use async APIs, worker threads or a queue.

### NODE-003 · SQL / NoSQL injection
**Severity:** P0
**Why it breaks:** AI builds queries with string templates; Mongo accepts `{"$gt":""}` objects from the body.
**How to test:** Send `' OR 1=1 --` and `{"$ne": null}` as inputs.
**Pass:** Rejected or treated as plain text.
**Fix:** Parameterized queries / ORM; validate with Zod; sanitize Mongo operators.

### NODE-004 · Missing authorization (IDOR)
**Severity:** P0
**Why it breaks:** Middleware checks the token but queries by ID only.
**How to test:** User A requests `/orders/:id` of user B.
**Pass:** 403 or 404.
**Fix:** Always filter by `userId` / `tenantId`.

### NODE-005 · No request timeouts
**Severity:** P1
**Why it breaks:** `fetch`/axios calls to third parties without timeout hang workers.
**How to test:** Point a third-party URL to a slow endpoint.
**Pass:** Request fails fast with a handled error.
**Fix:** Set timeouts (AbortSignal.timeout / axios timeout).

### NODE-006 · Memory leak
**Severity:** P1
**Why it breaks:** Global arrays/maps used as cache, listeners added per request.
**How to test:** Run a 10-minute load test, watch heap.
**Pass:** Heap stays flat.
**Fix:** Bounded cache (LRU), remove listeners.

### NODE-007 · Wrong trust proxy / rate limit
**Severity:** P1
**Why it breaks:** Behind a proxy, every request looks like the same IP, or rate limit is missing.
**How to test:** Hit login 100 times fast.
**Pass:** Blocked after the limit; real client IP logged.
**Fix:** `app.set('trust proxy', ...)` + express-rate-limit or similar.

### NODE-008 · Webhook not verified / not idempotent
**Severity:** P0
**Why it breaks:** AI trusts the webhook body; retries create duplicate orders.
**How to test:** Send the same webhook twice; send one with a fake signature.
**Pass:** One order; fake one rejected.
**Fix:** Verify signature, store event ID, skip duplicates.
