# React — chronic issues

### REACT-001 · useEffect infinite loop
**Severity:** P0
**Why it breaks:** AI puts an object/array/function in the dependency array or sets state that is also a dependency.
**How to test:** Open the page with React DevTools Profiler and the Network tab; watch for repeating renders or requests.
**Pass:** Effect runs once per real change.
**Fix:** Memoize dependencies (useMemo/useCallback) or move them inside the effect.

### REACT-002 · Secrets in the bundle
**Severity:** P0
**Why it breaks:** AI uses `VITE_`/`NEXT_PUBLIC_`/`REACT_APP_` for private keys.
**How to test:** Build, then search `dist`/`.next` for key prefixes (`sk_`, `AIza`, etc.).
**Pass:** No private keys found.
**Fix:** Move the call to a backend / server route.

### REACT-003 · Missing or index keys
**Severity:** P1
**Why it breaks:** AI uses `key={index}` on lists that reorder or delete.
**How to test:** Delete an item from the middle of an editable list.
**Pass:** Correct item removed; inputs keep their values.
**Fix:** Use a stable unique id as key.

### REACT-004 · Race condition on fetch
**Severity:** P1
**Why it breaks:** Fast typing or navigation lets an old response overwrite a newer one.
**How to test:** Type fast in search; throttle network in DevTools.
**Pass:** Only the latest result is shown.
**Fix:** AbortController or a data library (TanStack Query, SWR).

### REACT-005 · State update after unmount / leaked listeners
**Severity:** P1
**Why it breaks:** Timers, subscriptions and listeners without cleanup.
**How to test:** Navigate in and out of the page 10 times; watch memory and console.
**Pass:** No warnings, memory stable.
**Fix:** Return a cleanup function from every effect.

### REACT-006 · XSS via dangerouslySetInnerHTML
**Severity:** P0
**Why it breaks:** AI renders user or CMS HTML directly.
**How to test:** Save `<img src=x onerror=alert(1)>` as content.
**Pass:** No alert.
**Fix:** Sanitize with DOMPurify or render as text.

### REACT-007 · Whole-app re-render
**Severity:** P2
**Why it breaks:** Big context value recreated every render.
**How to test:** Profiler: type in one input, count re-rendered components.
**Pass:** Only related components re-render.
**Fix:** Split contexts, memoize value, or use a store (Zustand).

### REACT-008 · Hydration mismatch (Next.js)
**Severity:** P1
**Why it breaks:** `Date.now()`, `Math.random()` or `window` used during server render.
**How to test:** Check the console on first load in production build.
**Pass:** No hydration warnings.
**Fix:** Move client-only code to useEffect or a client component.
