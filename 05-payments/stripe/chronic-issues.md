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
**Why it breaks:** AI handles only the happy path. `invoice.payment_failed`, `customer.subscription.deleted` and the `past_due` / `unpaid` / `incomplete_expired` / `paused` states are ignored, so a user whose card was declined keeps premium.
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

### STRIPE-013 · Code written for an older Stripe API version
**Severity:** P0
**Why it breaks:** AI writes Stripe code from pre-2025 examples. Since API version `2025-03-31.basil` (pinned by stripe-node 18, stripe-python 12, stripe-php 17, Stripe.net 48 and later), `subscription.current_period_end` / `current_period_start` moved to the subscription items, and `invoice.subscription`, `invoice.payment_intent`, `invoice.charge` and `invoice.paid` were removed. In JS these read as `undefined`, so `new Date(undefined * 1000)` saves an invalid access end and renewals find no subscription; TypeScript errors get silenced with `as any`. Webhook payloads follow the endpoint's own `api_version`, so one handler can see two shapes, and Stripe.net and stripe-go reject events from another version until AI turns the check off (`throwOnApiVersionMismatch: false`).
**How to test:** `grep -rnE "current_period_(start|end)|latest_invoice\.payment_intent|invoice\.(subscription|payment_intent|charge)\b|throwOnApiVersionMismatch|IgnoreAPIVersionMismatch"` (ignore event names like `'invoice.paid'`) and look for `as any` on Stripe objects. Compare the SDK's pinned version, the `apiVersion` passed to the client and the webhook endpoint's version (Dashboard → Webhooks). Renew a subscription on a test clock and read the saved period end.
**Pass:** Field reads match the pinned version (`items.data[].current_period_end`, `invoice.parent.subscription_details.subscription`, `latest_invoice.confirmation_secret`); SDK, client and endpoints use one version; the renewal moves the period end.
**Fix:** Pin one API version for the SDK and every endpoint (a new endpoint is needed to change an endpoint's version) and migrate field reads using Stripe's changelog. See `UNI-009`.

### STRIPE-014 · Webhooks work with `stripe listen`, never arrive in production
**Severity:** P0
**Why it breaks:** Locally, a bare `stripe listen` forwards every event type to localhost and signs them with its own `whsec_` secret. In live mode AI never creates the endpoint, creates it with only `checkout.session.completed`, or points it at a URL that answers 301, 307, 401 or 403 (http→https, apex→www, a trailing slash, auth middleware, bot protection). Stripe needs a 2xx from that exact URL, so renewals, failures and cancellations never reach the database while Stripe keeps retrying for days.
**How to test:** `stripe webhook_endpoints list --live` (or Dashboard → Webhooks in live mode): compare `url`, `status` and `enabled_events` with the event types the handler switches on. `curl -i -X POST <live webhook URL>` must return 400 from the signature check, not 3xx, 401 or 403. Production's secret is the live endpoint's, not the one `stripe listen` printed.
**Pass:** An enabled live endpoint on the final URL subscribes to every handled event, and its recent deliveries are 2xx.
**Fix:** Create the live endpoint from a script or infrastructure code with the handled event list; exempt the route from auth, CSRF and redirects; alert on failed deliveries. See `STRIPE-001`, `STRIPE-007`.

### STRIPE-015 · First payment works, renewals fail
**Severity:** P0
**Why it breaks:** In a custom Elements flow, AI creates the subscription with `payment_behavior: 'default_incomplete'` and confirms the first invoice in the browser, but leaves `payment_settings.save_default_payment_method` at its default, `off`, and never sets the customer's `invoice_settings.default_payment_method`. The first charge succeeds; a period later the renewal invoice has no payment method ("This customer has no attached payment source or default payment method") and the subscriber drops to `past_due`.
**How to test:** Subscribe through the app in test mode, then retrieve the subscription and the customer: `default_payment_method` or `invoice_settings.default_payment_method` must be set. End to end: run the flow for a customer on a test clock and advance one period.
**Pass:** The renewal invoice is paid automatically.
**Fix:** `payment_settings: { save_default_payment_method: 'on_subscription' }` when creating the subscription, or Checkout in `subscription` mode, which saves the card for renewals.

### STRIPE-016 · Checkout metadata never reaches the subscription
**Severity:** P0
**Why it breaks:** AI puts `metadata: { userId }` on the Checkout Session and later reads `subscription.metadata.userId` in `customer.subscription.updated`, `customer.subscription.deleted` and `invoice.paid`. Stripe doesn't copy metadata to related objects, so those events find no user: renewals don't extend access and cancellations don't remove it. The usual fallback is `customer_details.email`, which is whatever the buyer typed into Checkout.
**How to test:** For each handled event type, find where the user id comes from. Buy through the app in test mode, cancel the subscription in the Dashboard and renew one on a test clock: the user's row must change both times.
**Pass:** Every event finds the user by a stored `customer` or `subscription` id, or by `subscription_data.metadata`, never by e-mail.
**Fix:** Send `client_reference_id` and `subscription_data.metadata` (or `payment_intent_data.metadata`); at `checkout.session.completed`, save the `customer` and `subscription` ids on the user. See `STRIPE-005`, `PAY-004`.

### STRIPE-017 · Access granted while the subscription is `incomplete`
**Severity:** P0
**Why it breaks:** With `payment_behavior: 'default_incomplete'`, or when the first charge needs 3D Secure, `subscriptions.create` returns `status: 'incomplete'` and `customer.subscription.created` fires before any money moves. AI unlocks premium on the create call or on that event. If the customer fails or closes the 3DS challenge, nothing is charged, the subscription becomes `incomplete_expired` after 23 hours, and the user keeps premium.
**How to test:** Subscribe with test card `4000002500003155` and fail or close the authentication; check access right away and again after a test clock passes 23 hours.
**Pass:** Access starts only on `invoice.paid` or status `active` / `trialing`; `incomplete` and `incomplete_expired` give nothing.
**Fix:** Treat `incomplete` as pending and grant from `invoice.paid`; confirm the first payment in the browser with `latest_invoice.confirmation_secret.client_secret`. See `STRIPE-002`, `PAY-014`.
