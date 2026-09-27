# Node.js — AI audit prompts

Paste into Claude Code, Cursor or any agent:

```
Audit this Node.js backend for production readiness.
Check: unhandled async errors, event loop blocking, injection (SQL/NoSQL),
authorization per resource, missing timeouts, rate limiting, webhook signature + idempotency,
env validation, graceful shutdown. Output a table: severity (P0/P1/P2), file:line, issue, fix.
Do not change code until I approve.
```
