# Angular — tooling

| Purpose | Tool |
|---|---|
| Unit | Vitest (the `ng new` default since v21) or Jasmine / Karma |
| E2E | Playwright or Cypress |
| Lint | angular-eslint; eslint-plugin-rxjs-x (`no-floating-observables`, `no-nested-subscribe`) |
| Change detection | Angular DevTools; `provideCheckNoChangesConfig({ exhaustive: true })` in development |
| DOM sinks | `Content-Security-Policy-Report-Only: require-trusted-types-for 'script'` header; DOMPurify for rich HTML |
| Versions | `ng version`, `ng update`, `npm ls @angular/core @angular/ssr`, `npm audit --omit=dev` |
| SSR checks | curl (Host header, `Cache-Control`, `ng-state`), k6 or `xargs -P` for parallel two-user tests |
