# React — AI audit prompts

Paste into Claude Code, Cursor or any agent:

```
Audit this React project for production readiness.
Check: useEffect dependency loops, missing cleanups, list keys, fetch race conditions,
secrets in client env vars, dangerouslySetInnerHTML usage, missing loading/error/empty states,
hydration issues (if Next.js). Output a table: severity (P0/P1/P2), file:line, issue, fix.
Do not change code until I approve.
```
