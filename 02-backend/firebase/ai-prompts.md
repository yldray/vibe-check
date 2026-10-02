# Firebase — AI audit prompts

Paste into Claude Code, Cursor or any agent:

```
Audit this Firebase project for production readiness.
Check: rules that are open, test-mode or "signed in = allowed", owners who can edit role/plan/credits
fields (no affectedKeys().hasOnly), create rules that don't pin the owner, catch-all {document=**}
matches, admin checks on an unverified token.email, Storage rules without size/type limits,
service accounts or firebase-admin in client code, functions without auth checks, triggers that write
to their own path, missing maxInstances, functions.config(), Node 18/20 runtimes, unbounded or
leaked listeners, missing composite indexes, retired FCM legacy / Dynamic Links code, secrets in
Remote Config, user data left behind after account deletion.
Output a table: severity (P0/P1/P2), file:line, issue, fix.
Do not change code until I approve.
```
