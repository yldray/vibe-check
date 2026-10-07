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

### PAY-024 · Store server notifications accepted without verification
**Severity:** P0
**Why it breaks:** App Store Server Notifications v2 have no shared secret: the body is a signed JWS (`signedPayload`) with more JWS documents inside. AI base64-decodes it and trusts it, so anyone who knows the URL can post a forged "subscribed" or "renewed" event. Google Play notifications arrive as a Pub/Sub push that AI accepts without checking the push's auth token. Both handlers also apply events for another bundle id or package name, and sandbox events to production data.
**How to test:** Post a hand-made payload with a self-signed `x5c` chain, then a real payload with one byte changed; post a Pub/Sub-shaped body without an `Authorization` header; post a sandbox event and one for another bundle id.
**Pass:** All are rejected or ignored with a log entry and the database is untouched; the store's "send test notification" is accepted.
**Fix:** Verify every JWS layer (chain to Apple's root CA, Apple's marker on the leaf, ES256 signature — Apple's App Store Server Library does this). For Google, require an authenticated push subscription, verify the OIDC token's audience and service account, then re-read the purchase from the Play Developer API. Drop events whose bundle id, package name or environment don't match. See `PAY-003`.

### PAY-025 · Store notifications mapped by the wrong field, or lost when the record isn't found
**Severity:** P1
**Why it breaks:** AI branches on a field it saw in one sample, such as Apple's `transactionReason`, instead of `notificationType` + `subtype`. A cancellation (auto-renew turned off) then reactivates the subscription; refunds and revocations match no branch; Google types such as on hold, paused, revoked and recovered are missing. The record is looked up by an id that changes on every renewal instead of the original transaction id or purchase token, and when the notification arrives before the app has posted the purchase, the handler returns 200 and the event is gone.
**How to test:** Replay a recorded notification of every type and subtype (subscribe, renew, auto-renew off/on, grace period, expired, refund, revoke, refund reversed) plus one for a purchase the server hasn't stored yet; check the row and the HTTP status after each.
**Pass:** Every type maps to a documented state change or is logged as deliberately ignored; a cancellation never extends or reactivates access; an unknown purchase returns 5xx so the store retries.
**Fix:** One table from notification type/subtype to an access decision; key records on the original transaction id or purchase token; non-2xx until the event is applied. See `PAY-005`, `UNI-020`.

### PAY-026 · One store purchase unlocks several accounts
**Severity:** P0
**Why it breaks:** A store purchase belongs to the device's Apple ID or Google account, not to your app account. The user logs out, logs in as someone else and taps Subscribe or Restore; the store delivers the same purchase again and the register endpoint opens an active subscription on the second account too. One payment unlocks any number of accounts.
**How to test:** Buy with test account A, log out, log in as B and restore or subscribe; list active subscriptions that carry that original transaction id or purchase token.
**Pass:** One active binding per store purchase; the second account gets a clear "this purchase belongs to another account" error and the app finishes the transaction; renewals on the bound account still work; a binding that has expired or whose account was deleted may move.
**Fix:** A unique active binding per original transaction id / purchase token, enforced on the server; send `appAccountToken` (iOS) or `obfuscatedAccountId` (Android) and compare it. See `PAY-018`, `UNI-012`.

### PAY-027 · An old store transaction recorded as a new purchase
**Severity:** P0
**Why it breaks:** AI reads `latest_receipt_info[0]` or `purchases[0]` as "the" subscription; for a returning subscriber that is the oldest, long-expired period. StoreKit and Play also redeliver unfinished transactions at every launch, and the purchase listener posts each one as new. The server stores today as the start and a past date as the end: fake "new subscribers" in reports, and a valid, longer subscription overwritten by an expired one.
**How to test:** With a sandbox account subscribe, let it lapse, subscribe again; leave a transaction unfinished and relaunch several times; post a receipt whose expiry is in the past while a valid subscription exists. Grep for `receipt_info[0]`, `Subscriptions[0]`, `purchases[0]`.
**Pass:** The entry with the latest expiry is used (re-derived on the server); a past-expiry purchase writes nothing and is only logged; expiry only ever moves forward; the start date is the store's purchase date.
**Fix:** Reduce by max expiry or read the latest transaction from the App Store Server API; idempotent on the original transaction id with an expiry guard; finish the transaction afterwards. See `PAY-023`.

### PAY-028 · Subscription end date taken from the client or left at a default
**Severity:** P1
**Why it breaks:** One platform's app sends an expiry date, the other only a purchase token. AI stores whatever arrives, so the date is null, `0001-01-01` or 1970: admin shows the subscriber as expired, a cancellation locks them out at once instead of at period end, renewal logic misfires. When the store API call fails, a fallback guesses the date from the product id and nothing re-checks it.
**How to test:** Register an Android purchase with only a token and an iOS one with no date; query active subscriptions with an empty or pre-2000 expiry.
**Pass:** The server reads expiry from the store API; the query returns zero rows; a guessed date is flagged and corrected by the next notification.
**Fix:** One server-side store client used by the register endpoint and the notification handler; reject or flag min and epoch dates. See `UNI-016`, `OPS-018`.

### PAY-029 · The premium flag is set by each event instead of computed from all subscriptions
**Severity:** P1
**Why it breaks:** AI keeps a denormalized `is_premium` on the user and lets each provider's event set it. A store cancellation sets it to false while a web subscription is still active. Rows also keep `status = active` after their end date, so checks that read status alone treat long-expired subscriptions as live.
**How to test:** Give a user an active web subscription and a store one, then send a store expire event; count rows with `status = active` and an expiry in the past.
**Pass:** The user keeps access; the count is 0, or every reader also checks expiry.
**Fix:** Recompute the flag from all of the user's subscriptions across providers after every change; "active" = status AND expiry, in one shared predicate. See `PAY-019`, `UNI-019`.

### PAY-030 · "Couldn't ask" treated the same as "not subscribed", or the reverse
**Severity:** P0
**Why it breaks:** The entitlement check has three outcomes but AI keeps two. First version: any failure means "no subscription", so an offline subscriber is thrown to the paywall and loses their downloads. Patched version: every non-OK answer means "unknown, let them in", so the server's explicit "access denied" grants free access.
**How to test:** Airplane mode as a subscriber (you reach the app and downloads); a non-subscriber online whose check returns an error status (paywall); a server 5xx (no free access).
**Pass:** Only "the request never reached the server" (network error, timeout) is unknown, answered from the last confirmed entitlement within an expiry window; any server answer is a decision.
**Fix:** Classify by error type (no response vs response); cache the last confirmed entitlement with an expiry. See `PAY-014`, `UNI-016`.

### PAY-031 · Purchase confirmation fires several times
**Severity:** P1
**Why it breaks:** After the store callback, AI polls the server with `setInterval` until access is granted. Overlapping async polls each see "granted": stacked "Subscription active!" alerts, repeated navigations and duplicate purchase analytics. The first poll runs before the server has written the record, so every purchase also flashes a false "pending, check your status" warning.
**How to test:** Buy in the sandbox with a throttled network; count alerts, navigations and purchase events.
**Pass:** One success path behind a ref or flag; the interval is cleared before any await; a loading state until the server confirms, with a hard timeout; "pending" only when the store reports pending.
**Fix:** A single `finishPurchase()` with an idempotency flag, or a server push / one request that waits on the server. See `PAY-020`.

### PAY-032 · Paywall discounts and prices not taken from the store
**Severity:** P1
**Why it breaks:** AI hardcodes "Save 27%" and a struck-through yearly price. When store prices change, the claim is false (a consumer-law problem as well as a review one). Derived prices are formatted with the device locale while the store's own string uses the storefront's format, so the paywall shows `$22.99` next to `$35,88`.
**How to test:** Change a product price in the sandbox or use a sandbox account in another storefront; check the badge and every price on the paywall.
**Pass:** Percentages and reference prices are computed from the store products; the badge hides when there is no discount; derived prices follow the store string's format.
**Fix:** Compute from the products' numeric price and currency; format like the store's localized string, `Intl` only as fallback. See `PAY-011`.

### PAY-033 · Promo codes anyone can use, or use again
**Severity:** P1
**Why it breaks:** AI gives a promo code only a total usage cap. A code meant for a specific group (an apology to users hit by an outage, staff, one partner's customers) works for whoever gets hold of it, and the same account can redeem it again with each new subscription. Or the rule is checked in the price preview but not where the payment is created, or not on the free, no-card path.
**How to test:** Redeem a restricted code from an account outside the group; redeem any code twice from one account; call the payment-creation endpoint directly with the code, skipping the preview; repeat on the free-trial path.
**Pass:** Refused everywhere with a clear message, before any payment starts.
**Fix:** Eligibility in one server-side service (allowed list or segment, one use per account, expiry, usage cap) called by every endpoint that accepts a code; record the redemption in the same transaction as the order. See `UNI-012`.

## Before launch

- [ ] `PAY-007` **P0** Test and live keys (and webhook secrets) are separate per environment; production uses live keys, nothing else does (see `ENV-003`)
- [ ] `PAY-008` **P1** Money is stored in minor units (cents) or a decimal type, never in floats (see `JS-003`)
- [ ] `PAY-009` **P1** Every order ends in a final state (paid, failed, refunded); orders stuck in "pending" are checked against the provider every day
- [ ] `PAY-010` **P1** Customers get a receipt or invoice as your country requires (see `INV-009`)
- [ ] `PAY-011` **P1** The total price, including taxes and fees, is shown before the user pays; nothing is added at the last step
- [ ] `PAY-021` **P1** After any change to provider request fields, URLs or keys, one real production payment passes and the daily count of successful payments is watched with an alert (health checks stay green while payments drop to zero)
- [ ] `PAY-022` **P1** Billing period and price logic lives in one place; if two services must compute it (checkout and the renewal job), they share code or tests with the same cases
- [ ] `PAY-023` **P0** Every store purchase is acknowledged or finished after it is verified and delivered: Google Play refunds and revokes purchases that aren't acknowledged within 3 days, and StoreKit delivers unfinished transactions again at every launch (`completePurchase` in Flutter, `finishTransaction` in react-native-iap; RevenueCat does it for you). Test: buy as a Play license tester (unacknowledged test purchases are refunded after 5 minutes) and check the purchase is still active 10 minutes later
