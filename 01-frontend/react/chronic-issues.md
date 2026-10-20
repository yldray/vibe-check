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
**Why it breaks:** `Date.now()`, `Math.random()` or `window` used during server render. `Intl` output also differs between Node's ICU and the browser's: `Intl.DisplayNames` (language and region names), `toLocaleString`, `Intl.DateTimeFormat` and `Intl.Collator` can return different text for the same locale, and the server's time zone (often UTC) isn't the visitor's.
**How to test:** Check the console on first load in production build. Grep server-rendered components for `Intl.` and `toLocale`, and load the page in two browsers set to different languages and time zones.
**Pass:** No hydration warnings.
**Fix:** Move client-only code to useEffect or a client component. Format locale-dependent strings on the server with an explicit locale and `timeZone` and pass them as props for the first render, or compute them on the client only after hydration.

### REACT-024 · Hook after an early return
**Severity:** P0
**Why it breaks:** AI adds `if (loading) return <Spinner/>` above a `useMemo` or `useEffect`. The number of hooks changes between renders and React crashes ("Rendered more hooks than during the previous render", minified error #310). With a warm cache the loading branch never runs, so it passes locally and crashes for new users.
**How to test:** `eslint-plugin-react-hooks` with `rules-of-hooks` as an error; open the screen with an empty cache and a slow network.
**Pass:** Lint is clean; the screen renders from the loading state.
**Fix:** All hooks above the first conditional return.

### REACT-027 · Derived state corrected in useEffect
**Severity:** P1
**Why it breaks:** AI keeps a value that depends on other state in its own state (the day of a date picker, a page number, a selected index) and fixes it in `useEffect` with `setState` when it goes out of range. The render before the effect uses the invalid value: moving from January 31 to February shows, emits or submits February 31, which `new Date` turns into March 3. Then a second render follows. The `react-hooks/set-state-in-effect` lint rule flags the pattern, so a CI lint step fails.
**How to test:** Run ESLint with `react-hooks/set-state-in-effect` on. In each date or range picker, pick the 31st, switch to a 30-day month and to February, and pick February 29, then switch to a non-leap year. Log the value passed to `onChange` or the form on every render.
**Pass:** Lint is clean; no out-of-range value is rendered, emitted or submitted.
**Fix:** Keep the raw state and derive the corrected value during render (`const day = Math.min(raw.day, daysInMonth)`), or correct it in the event handler that changes the month.

### REACT-028 · Query cache shared between accounts and stale after changes
**Severity:** P1
**Why it breaks:** AI uses TanStack Query, SWR or Apollo with keys like `['my-courses']` or `['favorites']` that hold no user id, and logout doesn't clear the cache. On a shared browser or phone (React Native too), the next account sees the previous user's plan, profile or list until a refetch lands. A change on one screen also doesn't invalidate the others: the user adds a favorite, opens "My list", sees the old cached list and thinks the save failed.
**How to test:** Log in as A and open the account screens. Log out without reloading or killing the app, log in as B, and open every user-specific screen before anything refreshes. Then change data on one screen (favorite, rating, progress) and open every other screen that shows it.
**Pass:** B never sees A's data, not even for a moment; every screen shows the new value on arrival.
**Fix:** Put the user id in every user-scoped key. On logout and account switch call `queryClient.clear()` (SWR: `mutate(() => true, undefined, { revalidate: false })`; Apollo: `client.clearStore()`) and delete any persisted copy of the cache. After each mutation, invalidate every key that shows that data; with a shared prefix (`['favorites', userId]`), `invalidateQueries({ queryKey: ['favorites'] })` covers them all. See `REACT-020`, `AUTH-004`.

### REACT-029 · Listener attached once, before the element exists
**Severity:** P2
**Why it breaks:** AI writes `useEffect(() => { const el = ref.current; if (!el) return; el.addEventListener(…) }, [])`. The component renders `null`, a spinner or an empty state until data arrives, so the effect's only run finds no element and returns: wheel handlers, arrow keys and observers never work on the real list. The player version: the code subscribes to a "ready" or `canplay` event after loading has started, the event has already fired, and the poster stays over a playing video.
**How to test:** Grep for `[]`-dependency effects that read `ref.current` and return early, in components that render conditionally. Throttle the network so data arrives late and use the feature. For players, also test with a cached or very fast source.
**Pass:** The feature works when data is slow and when the source is instant.
**Fix:** Use a callback ref (it runs when the element mounts), or put the render condition (`items.length > 0`) in the dependencies. After subscribing, read the current state (`video.readyState`, expo-video `player.status`) and treat "already ready or playing" as ready. See `REACT-005`.

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

### REACT-025 · Route handler that only checks the cookie exists
**Severity:** P0
**Why it breaks:** AI guards a route handler or BFF endpoint with `if (!cookies().get('session')) return 401` and then serves data by the ID in the URL. Any non-empty cookie value passes, and with no ownership check anyone who sends `Cookie: session=x` can read any record.
**How to test:** Call the route with a made-up cookie value, and with another user's real session and an ID that isn't theirs.
**Pass:** 401 for the made-up value; 403 or 404 for the other user.
**Fix:** Verify the token (`jwtVerify`), or fetch the data from your API with the bearer token so the API checks ownership. See `REACT-019`, `UNI-004`.

### REACT-026 · Files read from `src/` at runtime are missing after deploy
**Severity:** P1
**Why it breaks:** AI reads certificates, fonts or templates in a route handler with `readFileSync(path.join(process.cwd(), 'src/…'))`. It works in `next dev`, but `output: 'standalone'`, Docker images that copy only the build output and serverless bundles don't contain `src/`. The route throws ENOENT (500) in production, often before the code that would have returned a clear 503.
**How to test:** `grep -rn "process.cwd()" src/app src/lib`; run `next build` and look for each file under `.next/standalone` (or in the deploy image); call the route on the production build.
**Pass:** Every file read at runtime is in the build output, or imported.
**Fix:** `outputFileTracingIncludes` in `next.config`, or import the file as a module; read optional files only after the feature's config check.

### REACT-030 · Next.js standalone output deployed as the build leaves it
**Severity:** P1
**Why it breaks:** `output: 'standalone'` is a minimal server, not a finished package. `.next/standalone` contains neither `public` nor `.next/static`, so CSS, JS and images return 404 until they are copied in. Its `node_modules` can hold symlinks (pnpm's layout, Turbopack's links for external packages under `.next/node_modules`) that point into the build machine's folders, so an archive that keeps them as links arrives broken. `server.js` reads `PORT` and `HOSTNAME` from the process environment at start, so a `PORT` in `.env` files is ignored, and Docker sets `HOSTNAME` to the container id, so the server binds only that address and a health check on `localhost` gets no answer. Native packages (`sharp`, `better-sqlite3`) built on the CI's OS or CPU don't load on a different server.
**How to test:** `find .next/standalone -type l` (Windows: `Get-ChildItem .next\standalone -Recurse -Attributes ReparsePoint`). Unpack the artifact on a clean machine with the server's OS and CPU, start `node server.js` with only the service's environment, and request a page, a `/_next/static/` file and an image from `public`.
**Pass:** No links in the package; all three load; the server listens on the intended port and interface.
**Fix:** After `next build`, `cp -r public .next/standalone/ && cp -r .next/static .next/standalone/.next/` (or serve both from a CDN). Archive with links followed (`cp -rL`, `tar -h`) and check again that none remain. Set `PORT` and `HOSTNAME` (`0.0.0.0` in containers) in the service or container definition. Build on the server's OS and CPU architecture. See `REACT-026`, `OPS-015`, `OPS-016`.

### REACT-031 · Logged-in users see the visitor version of a cached page
**Severity:** P2
**Why it breaks:** AI makes the "logged in → go to the member area" decision only in middleware (`proxy.ts`). The home page is static; when a CDN, the browser's back/forward cache or the Next.js client router cache serves it, no request reaches that check, and members see the visitor page with locked content and a "Sign up" button. Right after login the same happens when the client opens a page it prefetched while logged out.
**How to test:** Log in, then open the root URL from the address bar, the logo, the back button and a new tab. Log in from every login screen and note where you land.
**Pass:** A logged-in user never sees the visitor version beyond a brief loading state.
**Fix:** Repeat the check in the page on the client and redirect with `router.replace()`, also on `pageshow` when `event.persisted` is true; or make session-dependent pages dynamic (read `cookies()`) and `no-store`. After login, call `router.refresh()` (or set the cookie in a Server Action, which clears the router cache) and navigate straight to the member page. See `REACT-019`, `REACT-020`, `WEB-016`.
