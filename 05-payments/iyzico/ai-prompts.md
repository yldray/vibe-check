# iyzico — AI audit prompts

Paste into Claude Code, Cursor or any agent:

```
Audit this project's iyzico integration.
Check: Checkout Form callback calls retrieve and compares paymentStatus, paidPrice, basketId
and conversationId with the order; sandbox URL and keys never in production; price equals
the basket sum and is computed on the server; renewal jobs never charge subscriptions that
iyzico's Subscription API already charges; webhooks verified and idempotent; sync failures
alert someone; customers matched by stored reference codes, not e-mail.
Output a table: severity (P0/P1/P2), file:line, issue, fix.
Do not change code until I approve.
```
