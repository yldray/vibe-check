# Vanilla JS — tooling

| Purpose | Tool |
|---|---|
| Unit | Vitest |
| E2E | Playwright (`timezoneId` for date tests) |
| Security lint | ESLint `no-eval`, `no-implied-eval`, `no-new-func`; `eslint-plugin-no-unsanitized` |
| DOM sinks | `Content-Security-Policy-Report-Only: require-trusted-types-for 'script'` header, read in the browser console; DOMPurify |
| Vulnerable CDN or vendored libraries | retire.js (`npx retire --path .`) |
| Storage and service workers | Chrome DevTools → Application (edit storage, block site data, service workers) |
| Headers, exposure and caching | `curl -sI` / `curl -s` |
