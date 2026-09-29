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

## Before launch

- [ ] `PAY-007` **P0** Test and live keys (and webhook secrets) are separate per environment; production uses live keys, nothing else does (see `ENV-003`)
- [ ] `PAY-008` **P1** Money is stored in minor units (cents) or a decimal type, never in floats (see `JS-003`)
- [ ] `PAY-009` **P1** Every order ends in a final state (paid, failed, refunded); orders stuck in "pending" are checked against the provider every day
- [ ] `PAY-010` **P1** Customers get a receipt or invoice as your country requires
- [ ] `PAY-011` **P1** The total price, including taxes and fees, is shown before the user pays; nothing is added at the last step
