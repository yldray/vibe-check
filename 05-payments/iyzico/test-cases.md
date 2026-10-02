# iyzico — pre-launch test cases

- [ ] `IYZICO-005` **P0** The sandbox base URL (`sandbox-api.iyzipay.com`) and sandbox keys are never used in production; live keys exist only there
- [ ] `IYZICO-006` **P1** Every request sets `conversationId` to your own order id, and responses are checked against it
- [ ] `IYZICO-007` **P1** `price` equals the sum of basket item prices and `paidPrice` is what the user saw (installment fees included); the total is computed on the server
- [ ] `IYZICO-008` **P1** Refunds and cancellations made in the iyzico panel reach your DB (webhook or sync) and change access
- [ ] `IYZICO-009` **P2** Before retiring iyzico: the remaining iyzico subscriptions are listed, each is migrated or left to expire, and the sync keeps running until the last one ends
- [ ] `IYZICO-014` **P1** Webhooks are rejected unless `X-IYZ-SIGNATURE-V3` matches: hex HMAC-SHA256 with the secret key over the fields iyzico documents for that event type (direct API, Checkout Form / Pay with iyzico, subscriptions). Test: replay a sandbox webhook with one character of the header changed (rejected) and unchanged (accepted)
- [ ] `IYZICO-015` **P1** An order is fulfilled only when the payment result has `fraudStatus` `1`: `0` (under review) holds it until a notification or a later retrieve shows `1`, and `-1` cancels it. Test: mock a retrieve response with `paymentStatus: SUCCESS, fraudStatus: 0`
- [ ] `IYZICO-016` **P1** Refunds follow iyzico's rules: a same-day payment is cancelled with `cancel` (full amount only); later, each basket item is refunded by its `paymentTransactionId`. Test: refund a 2-item sandbox order on the payment day and on the next day
