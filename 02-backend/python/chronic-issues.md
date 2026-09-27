# Python (FastAPI / Django) — chronic issues

> 🌱 Seeded list. Contributions welcome.

### PY-001 · Blocking calls in async routes
**Severity:** P1
**Why it breaks:** AI uses requests/sync DB drivers inside `async def`.
**How to test:** Load test; watch latency.
**Pass:** Stable latency.
**Fix:** httpx async / run sync code in threadpool or use `def`.

### PY-002 · DEBUG=True in production
**Severity:** P0
**Why it breaks:** Django/FastAPI debug left on.
**How to test:** Trigger an error in prod.
**Pass:** No stack trace shown.
**Fix:** Env-based settings.

### PY-003 · Unvalidated input
**Severity:** P0
**Why it breaks:** Raw dicts instead of Pydantic models / forms.
**How to test:** Send wrong types and extra fields.
**Pass:** 422 / rejected.
**Fix:** Pydantic schemas, Django forms/serializers.
