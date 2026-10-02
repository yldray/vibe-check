# Vue — tooling

| Purpose | Tool |
|---|---|
| Unit | Vitest + Vue Test Utils |
| E2E | Playwright (two browser contexts for user A / user B, throttled network) |
| Lint | eslint-plugin-vue (`flat/recommended`; `@nuxt/eslint` for Nuxt): `vue/no-v-html`, `vue/no-use-v-if-with-v-for`, `vue/require-v-for-key`, `vue/no-mutating-props` |
| State and SSR payload | Vue DevTools, Nuxt DevTools (Payload tab) |
| Server input validation | Zod or Valibot with h3 `readValidatedBody` / `getValidatedQuery` |
| Sessions | nuxt-auth-utils (sealed HttpOnly cookie, `requireUserSession`) |
| Error tracking | `@sentry/vue`, `@sentry/nuxt` |
| Versions | `npm ls vue nuxt`, `npm audit` |
