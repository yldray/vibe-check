# PayTR — pre-launch test cases

- [ ] `PAYTR-006` **P0** Production uses `test_mode=0`, the live merchant id/key/salt and production `merchant_ok_url` / `merchant_fail_url`; nothing else does
- [ ] `PAYTR-007` **P0** The callback recomputes the hash (`merchant_oid` + salt + `status` + `total_amount`, keyed with the merchant key), compares it in constant time, and checks `total_amount` against the stored order before marking it paid
- [ ] `PAYTR-008` **P1** The callback is idempotent per `merchant_oid`: a replay changes nothing and still answers "OK"
- [ ] `PAYTR-009` **P1** `merchant_oid` is alphanumeric, unique per attempt and stored before the request is sent
- [ ] `PAYTR-010` **P1** A small card-verification charge (e.g. 1 TL to save a card) is refunded automatically, and a job checks that the refund queue empties
- [ ] `PAYTR-011` **P1** The callback URL set in the PayTR merchant panel points to production and is reachable without auth, WAF challenge or redirect
- [ ] `PAYTR-012` **P1** Recurring charges settle pending (`wait_callback`) rows through the status inquiry API before a new charge, and an "unknown" answer keeps the row pending
