# iyzico — chronic issues

### IYZICO-001 · Checkout Form result trusted without `retrieve`
**Severity:** P0
**Why it breaks:** The Checkout Form posts a `token` to your callback URL. AI marks the order paid as soon as the callback arrives, without calling the retrieve endpoint and checking `paymentStatus`, `paidPrice` and the `basketId` / `conversationId`. A failed payment, or a token from another order, unlocks access.
**How to test:** Post a token from a failed or unrelated payment to the callback.
**Pass:** Nothing unlocks; the order is marked paid only after `retrieve` returns `SUCCESS` with the expected price and basket.
**Fix:** Always call retrieve server-side and compare price, currency and basket/conversation id with your order. See `PAY-002`, `PAY-004`.

### IYZICO-002 · Your job charges what iyzico already charges
**Severity:** P0
**Why it breaks:** The app has both iyzico Subscription API plans (iyzico charges them) and saved-card charges (`cardUserKey`) run by your own renewal job. AI writes the job's selection from "subscription expired" alone, so it also picks subscribers whose renewal iyzico handles, and the user is charged twice.
**How to test:** List subscribers by source; run the renewal job's selection query and check that no iyzico-managed subscription is in it.
**Pass:** The job selects only subscriptions it owns, by an explicit source/provider column.
**Fix:** Filter on the provider that owns the renewal; never on dates alone. See `PAY-015`, `PAY-019`.

### IYZICO-003 · Subscription state known only from a nightly sync
**Severity:** P1
**Why it breaks:** AI polls iyzico once a night instead of receiving webhooks. Cancellations and failed renewals arrive up to a day late, and when the sync job breaks, nobody notices: cancelled users keep access and revenue reports go stale.
**How to test:** Cancel a sandbox subscription and check how long until your DB changes; stop the sync job and check that someone is alerted.
**Pass:** Webhooks (signature verified) update state within minutes; the sync is a safety net with a failure alert.
**Fix:** Register iyzico webhooks, verify their signature, process them idempotently; alert when the sync fails or finds drift.

### IYZICO-004 · Customers matched by e-mail
**Severity:** P1
**Why it breaks:** The sync matches iyzico customers to users by e-mail. E-mails change, differ in case, or belong to several rows (old deleted accounts), so a cancellation lands on the wrong user or on none.
**How to test:** Change a user's e-mail, or create a second row with the same e-mail, then run the sync.
**Pass:** Matching uses the customer/subscription reference code stored at sign-up.
**Fix:** Store iyzico reference codes on your subscription row and match on them. See `UNI-020`.
