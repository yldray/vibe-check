# Vue — chronic issues

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

### VUE-007 · User-supplied URLs and styles bound as-is
**Severity:** P0
**Why it breaks:** Vue escapes text and attributes but never checks a URL's scheme. AI binds profile links, CMS links and `?redirect=` values straight into `:href`, `:action`, `<iframe :src>`, `<NuxtLink :to>`, `navigateTo()`, `window.open()` or `location.href`, so a saved `javascript:alert(1)` runs in your origin when clicked (`<NuxtLink>` itself passed such values through before Nuxt 4.4.7 / 3.21.7). A user-controlled `:style` string can lay an invisible link over your real buttons.
**How to test:** Grep `.vue` files for `:href=`, `:action=`, `:src=` on `iframe`, `:to=`, `:style=`, `navigateTo(`, `window.open(` and `location.href =`, and trace each value back to user, CMS or query input. Save `javascript:alert(document.domain)` in every URL field and click the result; log in through `/login?redirect=javascript:alert(1)` and `/login?redirect=//example.org`.
**Pass:** No alert and no jump to another site; only `https:` links (plus `mailto:` / `tel:` where needed) render.
**Fix:** Check the scheme with `new URL()` on the server when saving and again before binding. Resolve redirects with `new URL(value, location.origin)` and require your own origin; a "starts with `/`" check is bypassed by `//host` and `/\host`. Bind single style properties (`:style="{ color }"`). See `AUTH-005`.

### VUE-008 · User content compiled as a Vue template
**Severity:** P0
**Why it breaks:** Vue templates are code. When Vue is mounted on server-rendered HTML (Blade, Twig, Django, ERB, Razor) and the root component has no `template` or `render`, Vue compiles that HTML, so a comment containing `{{ … }}` runs as JavaScript. AI also turns on the runtime compiler to silence "runtime compilation is not supported" (the CDN `vue.global.js`, an alias to `vue/dist/vue.esm-bundler.js`, Nuxt `vue.runtimeCompiler: true`) and then builds `template:` strings from data. With it on, Nuxt server-island props allowed code execution on the server before 4.5.1 / 3.21.10 (CVE-2026-71320).
**How to test:** Grep for `createApp(` / `new Vue(` roots without `template` or `render`, for `vue.global`, `vue.esm-bundler`, `runtimeCompiler` and `compile` imported from `vue`, and for `template:` strings built with `+` or `${`. Save `{{ 7*7 }}` as a name or comment and open every page that shows it.
**Pass:** The page shows `{{ 7*7 }}`, never `49`; the runtime-only build is used.
**Fix:** Mount Vue only on elements without server-rendered user content (pass data as JSON or props), or wrap that content in `v-pre`. Keep the runtime-only build; never build templates from data.

### VUE-009 · `v-if` next to `v-for`, rows keyed by index
**Severity:** P1
**Why it breaks:** AI writes Vue 2 patterns. In Vue 3, `v-if` runs before `v-for` on the same element, so `<li v-for="t in todos" v-if="!t.done">` throws and the list doesn't render. With `:key="index"` on a list that can be reordered or deleted, Vue patches rows in place: typed values, checkboxes and child state stay at the old position, so the wrong row looks deleted or edited.
**How to test:** Run eslint-plugin-vue (`flat/recommended`) with `vue/no-use-v-if-with-v-for`, `vue/require-v-for-key` and `vue/valid-v-for`. Grep for `:key="index"`, `:key="i"` and `:key="idx"` (no lint rule flags these). Type into a middle row of each editable list, then delete that row.
**Pass:** Lint is clean; the right row disappears and the others keep their values.
**Fix:** Move `v-for` to a wrapping `<template>` or filter in a `computed`; key rows by a stable id (`:key="item.id"`). See `REACT-003`.

### VUE-010 · A child component edits the parent's object
**Severity:** P1
**Why it breaks:** Vue warns when a child assigns a prop, but not when it changes a property of an object or array prop. AI binds an edit dialog straight to the row it received (`v-model="item.name"`, `props.items.push(…)`), so the list changes while the user types, Cancel doesn't undo it, and a failed save still shows the new value.
**How to test:** Run the `vue/no-mutating-props` lint rule. Open each edit dialog from its list, change fields and press Cancel; then block the API and press Save.
**Pass:** Lint is clean; after Cancel or a failed save the list shows the old values.
**Fix:** Edit a copy (`const draft = ref(structuredClone(toRaw(props.item)))`) and `emit('save', draft.value)`; use `defineModel()` when two-way binding is intended. See `QA-002`.

### VUE-011 · The screen shows data for the previous URL
**Severity:** P1
**Why it breaks:** AI loads data once in `onMounted(() => load(route.params.id))`. Vue Router reuses the component when only the param changes (`/users/1` → `/users/2`), so the old record stays under the new URL. In Nuxt, `` useFetch(`/api/search?q=${route.query.q}`) `` builds its URL once, a composable that wraps `useAsyncData` without a key gives every caller the same result, and a slow older response can overwrite a newer one.
**How to test:** From each detail page, follow an in-app link to another item of the same type; change only the filters, search or page number; type fast in search on "Slow 4G". Grep for `onMounted` blocks that read `route.`, `useFetch(` with a template string instead of a getter, and `useAsyncData(` without a key inside composables.
**Pass:** The content always matches the URL; the last request wins.
**Fix:** `watch(() => route.params.id, load, { immediate: true })`, aborting the old request in `onWatcherCleanup` (Vue 3.5+). Nuxt: pass a getter (`` useFetch(() => `/api/posts/${route.params.id}`) ``) or a reactive `query`, and key wrapped `useAsyncData` calls by their URL. See `REACT-004`.

### VUE-012 · Vue errors never reach the error tracker
**Severity:** P1
**Why it breaks:** In production, Vue catches errors from rendering, event handlers, watchers and lifecycle hooks and only logs them with `console.error`, so `window.onerror` never sees them. AI sets up `@sentry/browser`, or `@sentry/vue` without passing `app` or after `app.mount()`, and the dashboard stays empty while users hit broken screens.
**How to test:** Check that `Sentry.init` comes from `@sentry/vue`, receives `app` and runs before `app.mount()`, or that `app.config.errorHandler` reports to your tracker (Nuxt: the `@sentry/nuxt` module with client and server config). In a production build, make a click handler throw and look for the error in the dashboard.
**Pass:** The test error appears in the tracker.
**Fix:** `Sentry.init({ app, dsn })` before `app.mount()`, or an `app.config.errorHandler` that reports. See `WEB-004`.

## Nuxt

### VUE-013 · Module-level state shared between users
**Severity:** P0
**Why it breaks:** On the server a module loads once and serves every request. AI writes `export const user = ref(null)` in a composable, store or util, calls `useAuthStore()` at the top of a file (an API wrapper, a plugin), or keeps `let currentUser` in `server/`. The first request fills it and the next visitor's HTML is rendered with that user's data. With one developer in one browser it looks fine.
**How to test:** `grep -rnE "^(export )?(const|let|var) \w+ = (ref|reactive|shallowRef|computed)\(" app composables utils stores plugins`, `grep -rnE "^(export )?(const|let) \w+ = use\w+Store\(\)" --include=*.ts --include=*.js .` and `grep -rnE "^(export )?let " server` (skip `node_modules`, `.nuxt`, `.output`). Log in as user A in a browser and, while A browses, fetch the same pages logged out with curl; search the HTML for A's e-mail.
**Pass:** No module-level mutable state; logged-out HTML never contains another user's data.
**Fix:** `useState('key', () => …)` inside a `useX()` function; Pinia through `@pinia/nuxt`, with `useStore()` called inside `setup`, actions or functions; per-request data on `event.context` in server code.

### VUE-014 · Secrets and private fields in the page payload
**Severity:** P0
**Why it breaks:** Every server-rendered page carries `window.__NUXT__.config` (all of `runtimeConfig.public`) and a `<script id="__NUXT_DATA__">` payload with every `useFetch`, `useAsyncData` and `useState` result. AI puts API keys in `runtimeConfig.public` / `NUXT_PUBLIC_*` or in `app.config.ts` (bundled for the client), and returns whole database rows from `server/api` routes; `pick` and `transform` shrink the payload, but the API response still has every field. Public values set only on the host never appear in the build output, so a bundle search (`FE-001`) misses them.
**How to test:** Read `runtimeConfig.public` in `nuxt.config.*`, `app.config.ts`, and the `NUXT_PUBLIC_*` values in `.env*` and the host settings. Logged in on production, view the page source and search `__NUXT__` and `__NUXT_DATA__` for `secret`, `token`, `password`, `hash` and `sk_`. Call each `server/api` route a page uses and compare its fields with what the UI shows.
**Pass:** Only publishable values and the fields the UI needs.
**Fix:** Keep secrets at the top level of `runtimeConfig` (server only); server routes return small objects with only the needed fields. See `ENV-006`, `REACT-021`.

### VUE-015 · Server routes protected only by page middleware
**Severity:** P0
**Why it breaks:** Every file in `server/api` and `server/routes` is a public HTTP endpoint. AI protects pages with route middleware (`middleware/auth.ts`, `definePageMeta({ middleware })`, `routeRules.appMiddleware`) and leaves the handlers behind them open, or saves `readBody(event)` as-is. Route middleware runs in the Vue app, never for `/api/*`, and it has been bypassed for pages too: a mixed-case path skipped `appMiddleware` until Nuxt 4.5.1 / 3.21.10 (CVE-2026-53721, CVE-2026-71315), and `/__nuxt_island/page_*` rendered `.server.vue` pages without middleware (CVE-2026-47200).
**How to test:** List `server/api` and `server/routes`; grep each handler for a session check (`requireUserSession`, `getUserSession` or your own helper) and for `readBody(` without validation. Call every non-public handler with curl logged out, and as user B with user A's ids. Open protected pages as `/ADMIN/...` while logged out.
**Pass:** 401, 403 or 404 everywhere; every write validates its input.
**Fix:** Check the session and ownership at the top of each handler (`const { user } = await requireUserSession(event)` with nuxt-auth-utils, or one shared helper); validate with `readValidatedBody(event, schema.parse)`, `getValidatedQuery` and `getValidatedRouterParams`. Route middleware only redirects. See `UNI-003`, `UNI-004`, `REACT-019`.

### VUE-016 · One user's page or API response cached for everyone
**Severity:** P0
**Why it breaks:** For speed, AI adds `routeRules` with `swr`, `isr`, `cache` or `prerender` to dashboard or account pages, or wraps a user endpoint in `defineCachedEventHandler` / `defineCachedFunction`. Nitro keys the cache by URL plus only the headers listed in `varies`: cookies are dropped, but `event.context` from server middleware is passed in and stored `Set-Cookie` headers are replayed. The first user's data (or a logged-out render) is served to everyone, and `isr` also keeps it on the Vercel or Netlify CDN. On Nuxt 4.4.0–4.5.0, a cached page's `_payload.json` leaked the first user's data even to logged-out clients (CVE-2026-71316).
**How to test:** List the `routeRules` entries with `swr`, `isr`, `cache` or `prerender`, and every `defineCachedEventHandler`, `cachedEventHandler`, `defineCachedFunction` and `cachedFunction`; none may read the session, cookies or `event.context.user` unless the user id is part of `getKey`. Log in as A and open each cached page and its `_payload.json`, then load them logged out (curl) and as user B.
**Pass:** Only public pages and shared data are cached; B and logged-out clients never see A's data.
**Fix:** No cache rules on personalized routes; cache only the shared part with `defineCachedFunction`, keyed by its real inputs. See `REACT-020`.

### VUE-017 · Server-side fetches without the user's cookie
**Severity:** P1
**Why it breaks:** During SSR, `$fetch` doesn't send the browser's cookies; only `useFetch` with a relative URL and `useRequestFetch()` forward them. AI calls `$fetch('/api/me')` inside `useAsyncData`, a plugin or route middleware, or calls a separate backend through an absolute `baseURL`, so on every full page load the server sees a logged-out user: the page renders logged out or middleware redirects to `/login`. The opposite mistake sends `headers: useRequestHeaders()` (no list) to a third-party API, handing it the user's session cookie.
**How to test:** Grep `useAsyncData`, `plugins/` and `middleware/` for `$fetch(`, and `useFetch` calls with an absolute `baseURL`. Log in, open a protected page and reload it with the cache disabled. Grep for `useRequestHeaders()` without an argument.
**Pass:** Reload keeps you on the page with your data; only `cookie` or `authorization` is forwarded, and only to your own API.
**Fix:** `useFetch('/api/…')` or `useRequestFetch()` for your own routes; for a separate backend that reads the same cookie, `headers: useRequestHeaders(['cookie'])`.

### VUE-018 · Hydration mismatch
**Severity:** P1
**Why it breaks:** Each page renders twice, on the server and in the browser. AI reads `localStorage`, `window` or `document` in `setup`, formats dates with `new Date()` / `toLocaleString()` (the server's time zone and locale aren't the user's) or renders `Math.random()`. The HTML doesn't match, Vue re-renders, and event listeners may not attach, leaving dead buttons; unguarded browser APIs crash the server render instead (`localStorage is not defined`, a 500). Production logs only "Hydration completed but contains mismatches."
**How to test:** Open the main pages in `nuxt dev` and read the console for hydration mismatch warnings; repeat with the browser in another time zone and language. Grep setup code and templates for `localStorage`, `window.`, `document.`, `new Date(`, `Date.now(`, `Math.random(` and `toLocale`. For details in a production build, temporarily define `__VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'true'`.
**Pass:** No hydration messages; every button works on first load.
**Fix:** Browser-only code in `onMounted` or `<ClientOnly>`; `useCookie` instead of `localStorage` for values the server renders; `<NuxtTime>` for dates; `useState` for random values. See `REACT-008`, `FE-010`.
