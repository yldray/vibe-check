# React — AI audit prompts

Paste into Claude Code, Cursor or any agent:

```
Audit this React project for production readiness.
Check: useEffect dependency loops, missing cleanups, list keys, fetch race conditions,
secrets in client env vars, dangerouslySetInnerHTML usage, missing loading/error/empty states,
hydration issues (if Next.js).
Next.js server: auth inside every Server Action and route handler (not only proxy / middleware),
user data in cached or static routes, secrets in props passed to Client Components. Output a table: severity (P0/P1/P2), file:line, issue, fix.
Do not change code until I approve.
```
