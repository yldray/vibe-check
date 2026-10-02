# PayTR — AI audit prompts

Paste into Claude Code, Cursor or any agent:

```
Audit this project's PayTR integration.
Check: every response status handled (success / failed / wait_callback), merchant_oid stored
before the request, callback parses form data, recomputes the hash and compares it in constant
time, checks total_amount against the order (>= with installments), returns a bare plain-text OK
only after commit and is idempotent; amounts in the right unit per API (iFrame kuruş, Direct API
and refunds TL); user_ip is the customer's public IP; refunds carry a reference_no; merchant salt
never logged; test_mode and URLs per environment; optional fields (utoken, store_card) behind a
flag; recurring job: no automatic retry, one charge per day, pending rows settled before a new
charge, saved-card token read from a paid order only.
Output a table: severity (P0/P1/P2), file:line, issue, fix.
Do not change code until I approve.
```
