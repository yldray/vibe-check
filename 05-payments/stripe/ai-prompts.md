# Stripe — AI audit prompts

Paste into Claude Code, Cursor or any agent:

```
Audit this project's Stripe integration.
Check: webhook signature verified on the raw body, events deduped by event.id and read fresh
from the API, access granted only by the webhook and only when payment_status is paid
(async payment events handled), failed and deleted subscriptions remove access, one Customer
per user, price ids from config or lookup_key, idempotency keys on create calls, amounts in
the smallest currency unit, secret key never in the client, test and live keys separated,
code matches the pinned API version (current_period_end on items, no invoice.subscription),
live webhook endpoints exist with every handled event, renewals have a default payment method,
user found by stored customer/subscription ids (not Checkout metadata or e-mail), no access while
a subscription is incomplete, one fulfilment per purchase, no removed Stripe.js methods.
Output a table: severity (P0/P1/P2), file:line, issue, fix.
Do not change code until I approve.
```
