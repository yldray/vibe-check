# Vanilla JS — AI audit prompts

Paste into Claude Code, Cursor or any agent:

```
Audit this plain JavaScript project for production readiness.
Check: innerHTML and every other HTML / code sink (insertAdjacentHTML, outerHTML, document.write,
jQuery .html(), eval, string timers), user links and redirects with javascript: or //host,
message listeners without an exact origin check and postMessage(…, '*'), mode: 'no-cors' and public
CORS proxies, fetch calls that ignore response.ok, date-only strings parsed as UTC, unguarded
localStorage reads, innerHTML +=, buttons and Enter that submit forms, listeners added repeatedly,
float money math, polyfill.io and unpinned CDN scripts without integrity, secrets in scripts.
Output a table: severity (P0/P1/P2), file:line, issue, fix.
Do not change code until I approve.
```
