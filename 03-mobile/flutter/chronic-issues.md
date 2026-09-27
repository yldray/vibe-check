# Flutter — chronic issues

> 🌱 Seeded list. Contributions welcome.

### FLT-001 · setState after dispose
**Severity:** P1
**Why it breaks:** Async work finishes after the widget is gone.
**How to test:** Leave the screen during a request.
**Pass:** No errors.
**Fix:** Check `mounted`; cancel work.

### FLT-002 · Rebuilding the whole tree
**Severity:** P2
**Why it breaks:** State high in the tree; no const widgets.
**How to test:** Flutter DevTools rebuild stats.
**Pass:** Minimal rebuilds.
**Fix:** const widgets, scoped state.

### FLT-003 · Secrets in Dart code
**Severity:** P0
**Why it breaks:** API keys hardcoded or in --dart-define for private keys.
**How to test:** Search the compiled app for keys.
**Pass:** No private keys.
**Fix:** Backend proxy.
