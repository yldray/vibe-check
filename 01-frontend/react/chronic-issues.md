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

## Next.js server (Server Actions, route handlers, proxy / middleware)

### REACT-018 · Server Action without auth
**Severity:** P0
**Why it breaks:** Every `"use server"` function is a public POST endpoint. AI assumes only its own form calls it and skips the session and ownership check.
**How to test:** Call the action from the browser console or with curl, logged out and with another user's IDs.
**Pass:** Rejected.
**Fix:** Check the session and ownership inside every action; validate its input with a schema (Zod).

### REACT-019 · Auth only in proxy / middleware
**Severity:** P0
**Why it breaks:** AI protects pages only in `middleware.ts` (`proxy.ts` since Next.js 16). A matcher change or a moved Server Function silently drops that coverage, and older versions could skip it entirely with the `x-middleware-subrequest` header (CVE-2025-29927).
**How to test:** Call route handlers and Server Actions directly, bypassing the pages. Check the installed `next` version.
**Pass:** The data layer rejects unauthenticated and foreign requests on its own.
**Fix:** Check auth where data is read and written (route handler, Server Action, data access layer). Next.js docs: verify authentication and authorization inside each Server Function, not in Proxy alone.

### REACT-020 · One user's data cached for everyone
**Severity:** P0
**Why it breaks:** AI fetches user-specific data in a route that is rendered statically or cached (`fetch` with `force-cache`, `unstable_cache` or `"use cache"` without the user in the key), so one user's page is served to others.
**How to test:** Log in as user A and open the page; log in as user B in another browser and open it. In the build output, personalized routes must be dynamic, not static.
**Pass:** Each user sees only their own data.
**Fix:** Read the session from cookies (this makes the route dynamic), use `cache: 'no-store'`, or put the user ID in the cache key.

### REACT-021 · Secrets passed to Client Components
**Severity:** P0
**Why it breaks:** A Server Component passes a whole database row or config object to a `"use client"` component. Everything in the props is serialized into the page, including hashes, tokens and other users' e-mails.
**How to test:** View the page source and the RSC payload in the Network tab; look for fields the UI doesn't show.
**Pass:** Only the fields the component needs.
**Fix:** Map to small DTOs before passing props; `import 'server-only'` in modules that hold secrets or DB access.
