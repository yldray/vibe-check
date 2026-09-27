# Android (Kotlin) — chronic issues

> 🌱 Seeded list. Contributions welcome.

### AND-001 · State lost on rotation / process death
**Severity:** P1
**Why it breaks:** State in Activity fields, not ViewModel/SavedState.
**How to test:** Rotate; enable 'Don't keep activities'.
**Pass:** State restored.
**Fix:** ViewModel + SavedStateHandle.

### AND-002 · ANR from main thread work
**Severity:** P0
**Why it breaks:** Network or DB on the main thread.
**How to test:** StrictMode; test on a low-end device.
**Pass:** No ANR.
**Fix:** Coroutines on IO dispatcher.

### AND-003 · Target SDK below Play requirement
**Severity:** P0
**Why it breaks:** Old template targets an old API level.
**How to test:** Compare targetSdk with the current Play requirement.
**Pass:** Meets requirement.
**Fix:** Update targetSdk and test behavior changes.
