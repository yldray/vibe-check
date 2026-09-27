# Vanilla JS — chronic issues

> 🌱 Seeded list. Contributions welcome.

### JS-001 · innerHTML with user input
**Severity:** P0
**Why it breaks:** AI builds HTML with string concatenation.
**How to test:** Insert an XSS payload.
**Pass:** Not executed.
**Fix:** textContent or sanitize.

### JS-002 · Event listeners added repeatedly
**Severity:** P1
**Why it breaks:** Listeners attached on every render.
**How to test:** Click once, count handler calls.
**Pass:** One call.
**Fix:** Attach once or use delegation.

### JS-003 · Floating point money math
**Severity:** P1
**Why it breaks:** Prices calculated with floats.
**How to test:** 0.1 + 0.2 style totals.
**Pass:** Exact totals.
**Fix:** Integer cents or a decimal library.
