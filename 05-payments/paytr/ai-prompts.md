# PayTR — AI audit prompts

Paste into Claude Code, Cursor or any agent:

```
Audit this project's PayTR integration.
Check: every response status handled (success / failed / wait_callback), merchant_oid stored
before the request, callback hash recomputed and compared in constant time, total_amount
checked against the order, callback idempotent and transactional, "OK" returned only after
commit, merchant salt never logged, test_mode and URLs per environment, optional fields
(utoken, store_card) behind a flag, recurring job: no automatic retry, one charge per day,
pending rows settled before a new charge, saved-card token read from a paid order only.
Output a table: severity (P0/P1/P2), file:line, issue, fix.
Do not change code until I approve.
```
