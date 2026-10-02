# Stripe — pre-launch test cases

- [ ] `STRIPE-007` **P0** Only the publishable key reaches the client; `sk_live_` exists only in production server secrets; each webhook endpoint has its own signing secret per mode (see `PAY-007`)
- [ ] `STRIPE-008` **P1** Every create call (customer, checkout session, payment intent, subscription) sends an `Idempotency-Key` derived from your order id (see `PAY-006`)
- [ ] `STRIPE-009` **P1** Amounts are sent in the currency's smallest unit, and zero-decimal currencies are handled (see `PAY-008`)
- [ ] `STRIPE-010` **P1** Every handled event was tested with `stripe listen` + `stripe trigger`, including payment failure, refund and dispute
- [ ] `STRIPE-011` **P1** Plan changes set `proration_behavior` explicitly and the result arrives through the webhook, not from the client
- [ ] `STRIPE-012` **P2** The Customer Portal (or your own page) lets users cancel and update their card; its configuration was reviewed in live mode
- [ ] `STRIPE-018` **P1** One purchase is fulfilled by one event type: credits, orders and e-mails aren't created on both `checkout.session.completed` and `payment_intent.succeeded` / `invoice.paid`, or on both `invoice.paid` and `invoice.payment_succeeded` (Stripe sends both for every paid invoice, and deduping by `event.id` doesn't catch it). Test: buy once and renew once on a test clock, then count the grants
- [ ] `STRIPE-019` **P0** No browser code calls a Stripe.js method its version removed: `redirectToCheckout` is gone since `@stripe/stripe-js` 8 (Stripe.js clover), and `handleCardPayment`, `handleCardSetup`, `confirmPaymentIntent` and `createSource` since 9 (dahlia); redirect to the Checkout Session's `url` instead. Test: `grep -rnE "redirectToCheckout|handleCard(Payment|Setup)|confirmPaymentIntent|createSource\("`
