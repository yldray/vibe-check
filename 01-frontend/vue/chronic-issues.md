# Vue — chronic issues

> 🌱 Seeded list. Contributions welcome.

### VUE-001 · Reactivity lost after destructuring
**Severity:** P1
**Why it breaks:** AI destructures reactive objects or props.
**How to test:** Change the source value; check the UI.
**Pass:** UI updates.
**Fix:** toRefs / storeToRefs / keep the reference.

### VUE-002 · Watcher / listener leaks
**Severity:** P1
**Why it breaks:** Manual listeners without cleanup.
**How to test:** Navigate in/out repeatedly.
**Pass:** No duplicate handlers.
**Fix:** onUnmounted cleanup.

### VUE-003 · v-html with user content
**Severity:** P0
**Why it breaks:** User content rendered as HTML.
**How to test:** Save an XSS payload.
**Pass:** Not executed.
**Fix:** Sanitize or render as text.
