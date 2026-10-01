# iyzico — pre-launch test cases

- [ ] `IYZICO-005` **P0** The sandbox base URL (`sandbox-api.iyzipay.com`) and sandbox keys are never used in production; live keys exist only there
- [ ] `IYZICO-006` **P1** Every request sets `conversationId` to your own order id, and responses are checked against it
- [ ] `IYZICO-007` **P1** `price` equals the sum of basket item prices and `paidPrice` is what the user saw (installment fees included); the total is computed on the server
- [ ] `IYZICO-008` **P1** Refunds and cancellations made in the iyzico panel reach your DB (webhook or sync) and change access
- [ ] `IYZICO-009` **P2** Before retiring iyzico: the remaining iyzico subscriptions are listed, each is migrated or left to expire, and the sync keeps running until the last one ends
