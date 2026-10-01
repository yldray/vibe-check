# Payments

Only if the app takes payments. Webhook signatures and idempotency are in `BE-007` and `BE-008`.

### PAY-001 · The price comes from the client
**Severity:** P0
**Why it breaks:** AI sends the amount from the browser or app when creating the payment, so a user can change it.
**How to test:** Change the amount in the request (DevTools or curl) and complete a test payment.
**Pass:** The server charges the catalog price.
**Fix:** The client sends only a product or plan ID; the server looks up the price.

### PAY-002 · Access unlocked by the success page
**Severity:** P0
**Why it breaks:** AI grants the purchase when the user lands on `/success`, not when the payment provider confirms it.
**How to test:** Open the success URL directly without paying.
**Pass:** Nothing unlocks.
**Fix:** Grant access only from a verified webhook or a server-side status check with the provider.

### PAY-003 · Premium status trusted from the client
**Severity:** P0
**Why it breaks:** The app keeps `isPremium` in local storage or trusts a store receipt without checking it on the server.
**How to test:** Flip the local flag, or replay an old or refunded receipt.
**Pass:** The server decides what the user can access.
**Fix:** Keep entitlements on the server, updated by provider webhooks and server-side receipt checks (App Store Server API, Google Play Developer API).

### PAY-004 · Webhook doesn't match the order
**Severity:** P1
**Why it breaks:** The webhook handler marks an order paid without checking that the amount and currency match what you expected.
**How to test:** Read the handler: it must load the order and compare amount and currency before marking it paid.
**Pass:** A mismatch is rejected and logged.
**Fix:** Compare the order ID, amount and currency with your own record.

### PAY-005 · Refunds and cancellations keep access
**Severity:** P1
**Why it breaks:** AI handles only the "paid" event, so refunds, chargebacks, cancellations and expired subscriptions change nothing.
**How to test:** Refund a test payment; cancel a test subscription and let it expire.
**Pass:** Access changes according to your policy.
**Fix:** Handle refund, dispute, cancel and expire events from the provider.

### PAY-006 · Double charge
**Severity:** P1
**Why it breaks:** A double tap or a network retry creates two payments.
**How to test:** Double-click Pay; replay the create-payment request.
**Pass:** One charge.
**Fix:** Disable the button while the request runs, and send an idempotency key when creating the payment.

### PAY-012 · Payment callback says OK before it processed
**Severity:** P0
**Why it breaks:** AI returns the success body the provider expects ("OK", 200) on every path: order not found, hash mismatch, missing config, or a DB error caught as "already processed". The provider stops retrying, the card is charged and access is never granted. With an empty signing key the hash is computed with an empty key, so anyone can forge a valid callback. A second checkout attempt overwrites the order reference, so the first tab's payment comes back for a reference that no longer exists.
**How to test:** Send the callback with an unknown order, a wrong hash, the DB stopped and the merchant key blanked. Start checkout in two tabs and pay in the first.
**Pass:** Each failure returns a non-success response and logs an error; the handler refuses to run without its key; the first tab's payment still grants access.
**Fix:** Return success only after the order is committed as paid; on replays check the entitlement really exists; fail closed when secrets are missing; make each payment attempt a child record of the order instead of overwriting it. See `PAY-004`.

### PAY-013 · Payment records deleted with their parent
**Severity:** P0
**Why it breaks:** AI deletes a plan, schedule or subscription together with its children, and the children include real payments, or a new purchase deletes the previous subscription row instead of closing it. Revenue history disappears, and later store or provider webhooks for the old subscription find nothing to update, so cancellations and double subscriptions go unseen.
**How to test:** Record a payment under a plan and delete the plan; buy, then upgrade or re-buy, then send a cancel event for the first subscription. Check the payments table, the revenue report and the webhook log.
**Pass:** Payments, invoices and old subscription rows survive; the cancel webhook finds its subscription.
**Fix:** Treat payment and subscription history as append-only: `Restrict` instead of cascade, soft delete or a status change, never a hard delete.

### PAY-014 · A pending result treated as failed or paid
**Severity:** P0
**Why it breaks:** Providers answer "pending" in many forms: PayTR `wait_callback`, Stripe `processing`, a status inquiry that says "unknown", a store purchase awaiting approval. AI maps everything that isn't "success" to failure, so the job tries again and charges twice, or maps it to success and unlocks before the money arrives. A status lookup that errors is also read as "failed".
**How to test:** Mock a pending answer and an erroring status lookup; run the charge path twice.
**Pass:** Three outcomes. Pending is stored with the provider's order id, blocks a new charge for that customer, and is settled later by inquiry or webhook; an unknown status stays pending.
**Fix:** An explicit pending state on the order; a settle step before every new charge. See `UNI-016`.

### PAY-015 · The renewal job charges twice in one cycle
**Severity:** P0
**Why it breaks:** A self-run renewal job (your own cron, not the provider's subscriptions) charges twice when: it "catches up" every day it missed since the last run; the "already charged today" guard looks only at paid orders, so a failed attempt is retried by the next run; the job framework's automatic retry (Hangfire, Sidekiq, BullMQ defaults) reruns the whole list after one exception; a manual trigger or a lock timeout starts a second run.
**How to test:** Run the job twice on the same day, once after a failed attempt, once with one subscriber throwing; set the last-run date a week back.
**Pass:** Each subscriber is attempted at most once per cycle, whatever the outcome; one pass, no replay of missed days; automatic retry off; errors caught per subscriber.
**Fix:** Guard on "attempted this cycle" (any status); `due_date <= today` already catches missed days; disable framework retries for charge jobs. See `OPS-003`.

### PAY-016 · The renewal job silently skips subscribers
**Severity:** P0
**Why it breaks:** AI selects who to charge with a magic filter (`plan_id < 900`, a hardcoded list of plan types). A new paid plan or campaign falls outside it: those subscribers are never charged, no error is logged and they keep watching or using the product for free.
**How to test:** Create a subscriber on the newest paid plan with an expired period and run the selection query.
**Pass:** Selection is by plan properties (paid, recurring, provider that owns renewal), and a daily report lists active subscribers past their period who were not attempted.
**Fix:** Select by what the plan is, not its id; alert on "expired but not attempted".

### PAY-017 · A new order status breaks every query that reads orders
**Severity:** P1
**Why it breaks:** You start writing failed (0) or pending (2) rows to the orders table, which used to hold only paid rows. Queries written for "only paid rows exist" now pick the latest row (empty card token), count attempts as payments (campaign counters advance early), and reports show failed attempts as revenue.
**How to test:** `git grep` every read of the orders table; check each one filters by the paid status.
**Pass:** Every reader filters the status it means.
**Fix:** Add the filter everywhere in the same change, or put attempts in their own table. See `UNI-013`.

### PAY-018 · A store plan change opens a second subscription
**Severity:** P0
**Why it breaks:** On Android, AI upgrades or downgrades with a plain purchase of the new product. Google creates a second subscription, and the user pays both in the same month. On iOS the same happens when the products are in different subscription groups.
**How to test:** Subscribe to plan A in a test track, switch to plan B in the app, and check the store's subscription list.
**Pass:** One active subscription after the change.
**Fix:** Android: a replacement purchase with the old purchase token and an explicit replacement mode; iOS: all plans in one subscription group. Server: one store transaction id binds to one account.

### PAY-019 · One user, two providers, two active subscriptions
**Severity:** P1
**Why it breaks:** The app sells through web (card provider), App Store and Google Play, or is moving from one provider to another. Nothing checks for an existing active subscription before creating a new one, so users pay twice, and cancelling one leaves the other running.
**How to test:** Subscribe on the web, then buy in the app with the same account; list the account's active subscriptions.
**Pass:** The second purchase is blocked or the user is told and the first is cancelled; reports flag accounts with more than one active subscription.
**Fix:** Check active subscriptions across providers before checkout; a daily report for duplicates.

### PAY-020 · Wrong amount on the success page, purchase counted twice
**Severity:** P1
**Why it breaks:** The success page shows a hard-coded fallback price when the real one is missing (a discounted user sees the full price), and analytics fire the purchase event on every load, refresh and iframe redirect with a `Date.now()` id, so revenue in ads and analytics is inflated.
**How to test:** Pay with a discount, refresh the success page, open it from the 3D Secure iframe; compare the amount shown and the events sent.
**Pass:** The amount comes from the paid order; one purchase event per order, deduplicated by the order id.
**Fix:** Load the order by id; use it as the event id; one path from the payment iframe to the page (`postMessage`).

## Before launch

- [ ] `PAY-007` **P0** Test and live keys (and webhook secrets) are separate per environment; production uses live keys, nothing else does (see `ENV-003`)
- [ ] `PAY-008` **P1** Money is stored in minor units (cents) or a decimal type, never in floats (see `JS-003`)
- [ ] `PAY-009` **P1** Every order ends in a final state (paid, failed, refunded); orders stuck in "pending" are checked against the provider every day
- [ ] `PAY-010` **P1** Customers get a receipt or invoice as your country requires
- [ ] `PAY-011` **P1** The total price, including taxes and fees, is shown before the user pays; nothing is added at the last step
- [ ] `PAY-021` **P1** After any change to provider request fields, URLs or keys, one real production payment passes and the daily count of successful payments is watched with an alert (health checks stay green while payments drop to zero)
- [ ] `PAY-022` **P1** Billing period and price logic lives in one place; if two services must compute it (checkout and the renewal job), they share code or tests with the same cases
