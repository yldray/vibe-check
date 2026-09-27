# Angular — chronic issues

> 🌱 Seeded list. Contributions welcome.

### NG-001 · Observables never unsubscribed
**Severity:** P1
**Why it breaks:** AI subscribes in components without cleanup.
**How to test:** Navigate in/out 10 times, watch memory and duplicate requests.
**Pass:** No duplicate calls, memory stable.
**Fix:** async pipe, takeUntilDestroyed, or signals.

### NG-002 · Change detection overload
**Severity:** P2
**Why it breaks:** Default strategy + functions called in templates.
**How to test:** Profiler while typing in a big form.
**Pass:** Minimal checks.
**Fix:** OnPush, signals, pure pipes.

### NG-003 · bypassSecurityTrust misuse
**Severity:** P0
**Why it breaks:** AI bypasses the sanitizer to render HTML.
**How to test:** Inject a script payload as content.
**Pass:** Not executed.
**Fix:** Remove bypass; sanitize server-side.
