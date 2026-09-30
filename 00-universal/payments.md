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

## Before launch

- [ ] `PAY-007` **P0** Test and live keys (and webhook secrets) are separate per environment; production uses live keys, nothing else does (see `ENV-003`)
- [ ] `PAY-008` **P1** Money is stored in minor units (cents) or a decimal type, never in floats (see `JS-003`)
- [ ] `PAY-009` **P1** Every order ends in a final state (paid, failed, refunded); orders stuck in "pending" are checked against the provider every day
- [ ] `PAY-010` **P1** Customers get a receipt or invoice as your country requires
- [ ] `PAY-011` **P1** The total price, including taxes and fees, is shown before the user pays; nothing is added at the last step
