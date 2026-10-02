# Vue — AI audit prompts

Paste into Claude Code, Cursor or any agent:

```
Audit this Vue / Nuxt project for production readiness.
Check: v-html and user-supplied URLs or styles (javascript: links, redirects), Vue mounted on
server-rendered user content or the runtime compiler, v-if with v-for and index keys, mutated props,
data that doesn't follow the URL, errors that never reach the tracker, lost reactivity, leaked
watchers.
Nuxt: module-level state shared between requests, secrets in runtimeConfig.public / app.config /
the payload, server/api routes without session and ownership checks or input validation, cache
rules on personalized pages, $fetch without the user's cookie during SSR, hydration mismatches,
token cookies written with useCookie, Nuxt version (4.5.1+), end-of-life Vue 2 / Nuxt 2 / Nuxt 3.
Output a table: severity (P0/P1/P2), file:line, issue, fix.
Do not change code until I approve.
```
