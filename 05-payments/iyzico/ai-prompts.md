# iyzico — AI audit prompts

Paste into Claude Code, Cursor or any agent:

```
Audit this project's iyzico integration.
Check: Checkout Form callback calls retrieve and compares paymentStatus, paidPrice, basketId
and conversationId with the order; 3DS callbacks verify the signature, require mdStatus 1 and
complete with threedsPayment; card fields never reach our server; the callback route works without
CSRF, login or a session cookie and parses form data; no SDK sample buyer data (74300864791,
85.34.78.112, John Doe); buyer.ip is the client IP; fraudStatus checked before fulfilment;
webhooks verify X-IYZ-SIGNATURE-V3 and are idempotent; refunds per paymentTransactionId;
sandbox URL and keys never in production; price equals the basket sum and is computed on the
server; renewal jobs never charge subscriptions that iyzico already charges; sync failures alert
someone; customers matched by stored reference codes, not e-mail.
Output a table: severity (P0/P1/P2), file:line, issue, fix.
Do not change code until I approve.
```
