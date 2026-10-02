# Angular — chronic issues

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

### NG-007 · HTML written straight into the DOM
**Severity:** P0
**Why it breaks:** Angular sanitizes only values bound in templates. When `[innerHTML]` strips something it needs (inline styles, SVG, iframes), AI writes the HTML through the DOM instead: `nativeElement.innerHTML = html`, `insertAdjacentHTML`, `outerHTML`, `document.write`, `renderer.setProperty(el, 'innerHTML', html)` or `sanitizer.sanitize(SecurityContext.NONE, html)`. None of these sanitize, so `<img src=x onerror=…>` in user, CMS or model content runs.
**How to test:** `grep -rnE "nativeElement\.(inner|outer)HTML|insertAdjacentHTML|document\.write|setProperty\([^)]*'(inner|outer)HTML'|SecurityContext\.NONE" src/`. Save `<img src=x onerror=alert(1)>` in every rich-text field. Serve the build once with the header `Content-Security-Policy-Report-Only: require-trusted-types-for 'script'; trusted-types angular angular#bundler` and click through: every console report is a raw DOM write.
**Pass:** No hit receives user, CMS or model content; no alert; no Trusted Types reports.
**Fix:** Bind with `[innerHTML]` or set `textContent`; when styles or SVG are needed, clean the HTML with DOMPurify first. See `NG-003`.

### NG-008 · Auth token sent to every origin
**Severity:** P0
**Why it breaks:** AI copies the interceptor example that adds the token to every request: `req.clone({ setHeaders: { Authorization: 'Bearer ' + token } })`, with no look at `req.url`. Every call to a third-party API, a CDN, a pre-signed upload URL or a URL taken from user content then carries the user's token. A prefix check isn't enough either: `req.url.startsWith('https://api.example.com')` also matches `https://api.example.com.evil.net`.
**How to test:** Find every interceptor (`HttpInterceptorFn`, `implements HttpInterceptor`, `withInterceptors`) that sets `Authorization` or a token header and read its URL check. In DevTools → Network, open requests to other domains and look for `Authorization`.
**Pass:** The token goes only to your API origin, matched exactly (`new URL(req.url, location.origin).origin === apiOrigin`).
**Fix:** Compare the request origin with an allow-list from config; pass every other request through untouched.

### NG-009 · Production build uses the development environment
**Severity:** P0
**Why it breaks:** Since Angular CLI 15, `ng new` creates no environment files, and `ng generate environments` makes `environment.ts` the production file with `fileReplacements` only for `development`. AI writes the older layout: `environment.ts` with `localhost` and `production: false`, plus an `environment.prod.ts` that no `fileReplacements` entry under `production` ever uses. `ng serve` works, `ng build` ships the localhost API. AI also puts private keys in these files, but everything in `src/environments/` is bundled into the client.
**How to test:** Read `fileReplacements` under `configurations.production` and `configurations.development` in `angular.json`, and the files in `src/environments/`. Run `ng build`, then `grep -rlE "localhost|127\.0\.0\.1" dist/<project>/browser`. Grep `src/environments/` for keys and secrets.
**Pass:** The production build holds only production URLs and flags; `src/environments/` holds no secrets.
**Fix:** One layout: keep production values in `environment.ts`, or add `{ "replace": "src/environments/environment.ts", "with": "src/environments/environment.prod.ts" }` to `configurations.production`. Move secrets to the server. See `FE-001`, `FE-016`.

### NG-010 · HTTP call never sent, or sent twice
**Severity:** P0
**Why it breaks:** `HttpClient` returns a cold Observable: nothing is sent until something subscribes, and every subscription sends the request again. AI writes `this.http.post(url, body);`, or calls a service method that returns the Observable, without subscribing, so the UI shows "Saved" while nothing left the browser. The opposite also happens: the service subscribes and the component subscribes too, or two `| async` pipes read one Observable, and the order is created twice.
**How to test:** Run ESLint with `rxjs-x/no-floating-observables` (type-aware), or follow every `http.post|put|patch|delete(` to a `subscribe`, `async` pipe, `toSignal`, `firstValueFrom` or `lastValueFrom`. In DevTools → Network, click each save, delete and pay button once.
**Pass:** Exactly one request per click.
**Fix:** Subscribe once, where the action happens (or `await firstValueFrom(...)`); share reads with one `@if (data$ | async; as data)`, `toSignal` or `httpResource`. See `UNI-013`.

### NG-011 · Disabled form fields dropped from the save
**Severity:** P0
**Why it breaks:** For an enabled `FormGroup`, `form.value` holds only the enabled controls. AI disables fields to show them read-only (`control.disable()`, `{ value, disabled: true }`) and sends `form.value` to the update endpoint. Those fields are missing from the body, so an endpoint that replaces the whole record writes `null` or defaults.
**How to test:** Grep reactive forms for `.disable(` and `disabled: true`, and their save handlers for `form.value`. Fill a record, save, reload it from the server and compare every field, including the read-only ones.
**Pass:** Read-only fields keep their values; save handlers send `getRawValue()`, or the server changes only the fields it receives.
**Fix:** `form.getRawValue()`, or show read-only data outside the form; PATCH semantics on the server. See `UNI-014`.

### NG-015 · View doesn't update in zoneless or OnPush components
**Severity:** P1
**Why it breaks:** New apps are zoneless since v21, and since v22 a component without `changeDetection` is `OnPush`. Angular then re-renders only when a signal read in the template changes, an `async` pipe emits, a template event fires or `markForCheck()` runs. AI writes zone-era code: `subscribe(data => this.items = data)`, assignments inside `setTimeout`, `.then()` or socket callbacks, `push()` into an array input. Data loads but appears only after the next click; when dev mode throws `ExpressionChangedAfterItHasBeenCheckedError` (NG0100), AI hides it with `setTimeout` or `detectChanges()`.
**How to test:** Check the Angular version, `provideZoneChangeDetection` and `changeDetection`. Grep components for `this.<field> =` inside `subscribe(`, `.then(`, `setTimeout(` and listener callbacks. Open every page and wait without touching the mouse or keyboard. In development, add `provideCheckNoChangesConfig({ exhaustive: true, interval: 1000 })`: it throws NG0100 for each binding updated without a notification.
**Pass:** Every page shows its data without user input; no NG0100.
**Fix:** Keep template state in signals (`signal`, `computed`, `toSignal`, `httpResource`) or use the `async` pipe; pass new arrays to inputs instead of `push()`; `markForCheck()` only as a last resort.

### NG-016 · Search results arrive out of order
**Severity:** P1
**Why it breaks:** AI wires search-as-you-type on `valueChanges` with a `subscribe` inside a `subscribe`, or with `mergeMap`. Every keystroke sends a request and nothing cancels the old ones, so a slow answer for "ap" overwrites the newer one for "apple".
**How to test:** Run `rxjs-x/no-nested-subscribe`, or grep for `subscribe(` inside a subscribe callback and for `mergeMap` / `concatMap` after `valueChanges`. In DevTools, set "Slow 4G" and type fast.
**Pass:** Only the latest query's results show; earlier requests show as cancelled.
**Fix:** `debounceTime(300)`, `distinctUntilChanged()`, `switchMap(q => this.http.get(...))`, or an `httpResource` keyed on a search signal. See `REACT-004`.

### NG-017 · `@for` tracked by `$index` on lists that change
**Severity:** P1
**Why it breaks:** `@for` doesn't compile without `track`, and AI picks `track $index` because it always works. Angular then reuses rows by position, so after a delete, insert or sort a row keeps the previous item's state: an open editor, a checked box, typed text, or a child component that loaded its data in `ngOnInit`. The other easy pick, `track item`, rebuilds every row when the data is fetched again and drops focus and typed text.
**How to test:** `grep -rn 'track \$index' src/`, and look for `track <loop variable>` on lists that change. Delete an item from the middle of an editable list, sort it, and refresh the data while typing.
**Pass:** Lists that change use `track item.id`; `$index` appears only on static lists.
**Fix:** Track by a stable unique id from the data. See `REACT-003`.

### NG-018 · XSRF token never sent, or protection switched off
**Severity:** P1
**Why it breaks:** Angular does only the client half of XSRF protection: it copies the `XSRF-TOKEN` cookie into an `X-XSRF-TOKEN` header on POST/PUT/PATCH/DELETE to the page's own origin, and older versions skip every absolute URL. AI puts a cookie-session API on another origin or behind an absolute URL, the backend's CSRF check fails (Laravel 419, Spring or Django 403), and AI then switches CSRF off (`withNoXsrfProtection()`, `csrf().disable()`, `@csrf_exempt`) or copies the token into every request, third-party ones included. Versions before 19.2.16 / 20.3.14 / 21.0.1 also sent the token to protocol-relative `//host` URLs (CVE-2025-66035).
**How to test:** If the session is a cookie, send a write from the app and look for `X-XSRF-TOKEN` in DevTools, then replay it with curl without the header. Grep for `withNoXsrfProtection`, `HttpClientXsrfModule.disable`, `csrf().disable`, `csrf_exempt` and CSRF exception lists.
**Pass:** Cookie-authenticated writes without a valid token get 403 / 419, or the API authenticates only with an `Authorization` header.
**Fix:** Serve the API under the app's origin (reverse-proxy `/api`) and call it with a relative URL; otherwise add the header in an interceptor limited to the API origin. Match names with `withXsrfConfiguration({ cookieName, headerName })` and keep the server check on.

### NG-019 · Service worker serves an old build or another user's data
**Severity:** P1
**Why it breaks:** AI adds `@angular/pwa` / `provideServiceWorker` and stops. Without update handling, the first visit after a deploy still runs the old build and open tabs stay on it; nothing handles `SwUpdate.versionUpdates` or `SwUpdate.unrecoverable`. For "offline support", AI adds a `dataGroups` entry for `/api/**` without `strategy`: the default, `performance`, answers from the cache until `maxAge`. The cache matches by URL, not by user, so stale balances show and the next account on a shared browser can get the previous user's responses.
**How to test:** Grep for `provideServiceWorker` / `ServiceWorkerModule`, `SwUpdate`, `VERSION_READY` and `unrecoverable`, and read `dataGroups` in `ngsw-config.json`. Deploy a visible change and reload an open tab. Log in as A, open the data pages, log out, log in as B and reload.
**Pass:** The app offers a reload on `VERSION_READY` and reloads on `unrecoverable`; user-specific endpoints aren't in `dataGroups`.
**Fix:** Handle `versionUpdates` and `unrecoverable` as the docs show; cache only public API data, with `freshness` where it changes often. See `FE-015`.

## Angular SSR

### NG-012 · SSR shares state between requests
**Severity:** P0
**Why it breaks:** One Node process renders every user's page. AI keeps per-user data where all requests share it: a module-level `let currentUser`, a `static` field, a file-level `new Map()` cache, an object provided with `useValue` (the SSR guide says these keep their value across requests), or a variable in `server.ts` that middleware sets and a provider reads. Under parallel load, user A's name, token or cart renders into user B's page. Angular had the same bug in its own platform injector (CVE-2025-59052, fixed in `@angular/platform-server` 18.2.14 / 19.2.15 / 20.3.0).
**How to test:** In code that runs on the server, grep for top-level `let`/`var`, `static` fields, file-level caches, mutated `useValue:` objects and `server.ts` variables written inside middleware; check that `main.server.ts` passes a `BootstrapContext` to `bootstrapApplication`. Request a personalized page 50 times in parallel (`xargs -P 20` with curl), half with user A's cookie and half with user B's, and grep each response for the other user's e-mail.
**Pass:** Request data comes only from `inject(REQUEST)`, `inject(REQUEST_CONTEXT)` or `useFactory` providers; no response holds the other user's data.
**Fix:** Pass request data through `angularApp.handle(req, context)` and inject it; use `useFactory` for per-request values. On older apps run `ng update @angular/core --name add-bootstrap-context-to-server-main`.

### NG-013 · Private SSR pages cached for everyone
**Severity:** P0
**Why it breaks:** To render logged-in pages on the server, AI forwards the user's cookie into server-side `HttpClient` calls. The HTML then holds that user's data twice: in the markup and in `<script id="ng-state">`, where `HttpTransferCache` stores whole GET responses, including fields the page never shows. A CDN, a reverse proxy or a `Cache-Control: public` header then serves that page to the next visitor. Credentialed requests are skipped by default, but AI turns on `includeRequestsWithAuthHeaders`, authenticates with its own header (`x-api-key`) that the filter doesn't know, or runs a version before 19.2.23 / 20.3.22 / 21.2.15, which cached them by default (CVE-2026-50170).
**How to test:** Open a private page on production with two accounts and compare `Cache-Control`, `Age` and the CDN headers (`CF-Cache-Status`, `X-Cache`). View the source and search `id="ng-state"` for data the page doesn't show or another user's data. Grep `withHttpTransferCacheOptions`, `include*` options, `transferCache`, `RenderMode` and `Cache-Control` in app and server code.
**Pass:** Private routes use `RenderMode.Server` with `Cache-Control: private, no-store` (or `RenderMode.Client`), aren't covered by the generated `'**'` → `RenderMode.Prerender` route, and are never stored by the CDN; `ng-state` holds only what the page shows.
**Fix:** `headers: { 'Cache-Control': 'private, no-store' }` on private `ServerRoute`s, `transferCache: false` on private calls, and the default transfer-cache filters. See `WEB-016`.

### NG-014 · SSR trusts any Host header
**Severity:** P0
**Why it breaks:** Angular SSR resolves relative `HttpClient` URLs against the request's host. Since `@angular/ssr` 19.2.21 / 20.3.17 / 21.1.5 it checks `Host` and `X-Forwarded-Host` against `allowedHosts` (CVE-2026-27739), and since v22 an unknown host gets `400 Bad Request` instead of client rendering. To make the deployed site work, AI sets `allowedHosts: ['*']` or `NG_ALLOWED_HOSTS=*`, sets `trustProxyHeaders: true` without a proxy that rewrites those headers, or builds URLs from `inject(REQUEST).headers.get('host')`. A forged `Host` then sends server-side requests, with any forwarded cookie or token, to an attacker or an internal address.
**How to test:** Read `security.allowedHosts` in `angular.json`, `allowedHosts` / `trustProxyHeaders` in `server.ts` and `NG_ALLOWED_HOSTS` / `NG_TRUST_PROXY_HEADERS` in the deploy config. Run `curl -H 'Host: evil.example' https://<origin>/`, and again with `-H 'X-Forwarded-Host: evil.example'`.
**Pass:** Only your host names are allowed; forged hosts get 400; server-side API URLs come from config.
**Fix:** List exact hosts (`*.example.com` patterns work), trust only the proxy headers your proxy overwrites, and never build URLs from request headers. See `SEC-013`.
