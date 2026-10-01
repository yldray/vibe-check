# Stripe — chronic issues

### STRIPE-001 · Webhook signature check removed or never added
**Severity:** P0
**Why it breaks:** `stripe.webhooks.constructEvent` needs the raw request body. The framework (Express `json()`, a Next.js route that calls `req.json()`) parses it first, verification fails, and AI "fixes" it by deleting the check. Anyone can now post a fake `checkout.session.completed`.
**How to test:** Post a hand-written event to the webhook URL without a `Stripe-Signature` header.
**Pass:** 400, nothing changes; real events from `stripe listen` still work.
**Fix:** Read the raw body for that route only and verify with the endpoint's signing secret.

### STRIPE-002 · Access granted before the money arrives
**Severity:** P0
**Why it breaks:** AI fulfils on `checkout.session.completed` without checking `payment_status`. With delayed payment methods (bank debits, transfers, some wallets) the session completes while the payment is still pending, and may fail days later.
**How to test:** Pay with a delayed-method test payment in test mode.
**Pass:** Access waits for `payment_status == "paid"` or `checkout.session.async_payment_succeeded`; `async_payment_failed` revokes.
**Fix:** Handle both async events; treat `processing` as pending. See `PAY-014`.

### STRIPE-003 · Events processed twice or in the wrong order
**Severity:** P1
**Why it breaks:** Stripe retries webhooks and doesn't guarantee order. AI applies each event's payload as-is, so a late `customer.subscription.updated` overwrites a newer state, and a retried event creates a second order.
**How to test:** Replay the same event id twice; deliver `updated` before `created`.
**Pass:** Event ids are stored and skipped on replay; state is read fresh from the API (or compared by timestamp) before writing.
**Fix:** Dedupe by `event.id`; on subscription events fetch the latest object from the API.

### STRIPE-004 · Failed renewals keep access forever
**Severity:** P1
**Why it breaks:** AI handles only the happy path. `invoice.payment_failed`, `customer.subscription.deleted` and the `past_due` / `unpaid` / `incomplete_expired` states are ignored, so a user whose card was declined keeps premium.
**How to test:** Use a test card that fails on renewal and advance a test clock past the retry window.
**Pass:** Access follows the subscription status according to your dunning policy.
**Fix:** Map every subscription status to an access decision; handle failure and deletion events. See `PAY-005`.

### STRIPE-005 · A new Customer on every checkout
**Severity:** P1
**Why it breaks:** AI creates a Customer (or lets Checkout create one) per purchase. One user ends up with several customers, saved cards and subscriptions scattered across them, and the portal shows only one.
**How to test:** Buy twice with the same account and count Customers in the dashboard.
**Pass:** One Customer per user, its id stored on the user and passed to every session.
**Fix:** Create the Customer once, store `customer.id`, reuse it.

### STRIPE-006 · Test price ids shipped to live
**Severity:** P1
**Why it breaks:** Price and product ids differ between test and live mode. AI hardcodes the ids it saw in test mode, and every live checkout fails with "No such price".
**How to test:** Grep for `price_` literals; start a live-mode checkout in staging with live config.
**Pass:** Price ids come from per-environment config or a lookup by `lookup_key`.
**Fix:** Use lookup keys or environment config; never literals.
