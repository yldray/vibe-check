# Stripe — pre-launch test cases

- [ ] `STRIPE-007` **P0** Only the publishable key reaches the client; `sk_live_` exists only in production server secrets; each webhook endpoint has its own signing secret per mode (see `PAY-007`)
- [ ] `STRIPE-008` **P1** Every create call (customer, checkout session, payment intent, subscription) sends an `Idempotency-Key` derived from your order id (see `PAY-006`)
- [ ] `STRIPE-009` **P1** Amounts are sent in the currency's smallest unit, and zero-decimal currencies are handled (see `PAY-008`)
- [ ] `STRIPE-010` **P1** Every handled event was tested with `stripe listen` + `stripe trigger`, including payment failure, refund and dispute
- [ ] `STRIPE-011` **P1** Plan changes set `proration_behavior` explicitly and the result arrives through the webhook, not from the client
- [ ] `STRIPE-012` **P2** The Customer Portal (or your own page) lets users cancel and update their card; its configuration was reviewed in live mode
