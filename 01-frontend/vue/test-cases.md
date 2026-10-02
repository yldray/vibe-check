# Vue — pre-launch test cases

- [ ] `VUE-004` **P0** Production build runs
- [ ] `VUE-005` **P1** Loading/error/empty states
- [ ] `VUE-006` **P1** Router history fallback on host
- [ ] `VUE-019` **P0** Protected routes redirect when logged out AND every API they call rejects the same request; `router.beforeEach` and Nuxt route middleware are UI only. Test: curl the APIs behind each protected page logged out and as another user
- [ ] `VUE-020` **P0** Nuxt is 4.5.1 or later (3.21.10 on 3.x, but see `VUE-021`): it fixes the middleware bypasses (CVE-2026-53721, CVE-2026-71315, CVE-2026-47200), the cross-user payload cache leak (CVE-2026-71316), `<NuxtLink>` / `navigateTo` XSS (CVE-2026-53722, CVE-2026-45669) and island code execution (CVE-2026-71320). Test: `npm ls nuxt`
- [ ] `VUE-021` **P1** No end-of-life version: Vue 2 (ended 2023-12-31; CVE-2024-6783 and CVE-2024-9506 are fixed only in Vue 3), Nuxt 2 (ended 2024-06-30) or Nuxt 3 (ended 2026-07-31). Test: `npm ls vue nuxt`
- [ ] `VUE-022` **P1** Returning users don't loop: with an expired or garbage token in storage or the cookie, opening `/`, a protected page and `/login` ends once on `/login`. The guard skips the login route, and a 401 clears the token before redirecting (Vue Router warns about redirect loops only in development)
- [ ] `VUE-023` **P1** Nuxt: forms rendered on the server have `method="post"` (and `@nuxt/ui` is 4.8.1 or later), so a submit before hydration doesn't send a GET with the password in the URL. Test: on "Slow 4G", submit the login form right after load; the URL and access logs hold no form fields
- [ ] `VUE-024` **P0** Nuxt: the session token is an `HttpOnly; Secure; SameSite=Lax` cookie set by a server route (nuxt-auth-utils `setUserSession` does this), not a `useCookie()` written in the browser, whose defaults are `httpOnly: false` and `secure: false`. Test: grep `useCookie(` for token names; check DevTools → Application → Cookies (see `FE-002`)
- [ ] `VUE-025` **P1** Nuxt: data written with `useStorage()` that must survive a restart or be shared between instances uses a driver set in `nitro.storage` (Redis, a database, a KV store); the default mount is in memory. Test: write a value, redeploy, read it back (see `ENV-008`, `OPS-019`)
