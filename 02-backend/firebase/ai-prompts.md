# Firebase — AI audit prompts

Paste into Claude Code, Cursor or any agent:

```
Audit this Firebase project for production readiness.
Check: Firestore, Storage and Realtime Database rules (if true, test-mode expiry dates,
request.auth != null without an owner check), service account keys or firebase-admin in client code,
Cloud Functions without an auth check, unbounded listeners without limit(), App Check.
Output a table: severity (P0/P1/P2), file:line, issue, fix.
Do not change code until I approve.
```
