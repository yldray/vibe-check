# PayTR — chronic issues

### PAYTR-001 · `wait_callback` handled as a failure
**Severity:** P0
**Why it breaks:** A non-3D or recurring charge can answer `status: "wait_callback"`: the bank is still deciding. AI checks only for `"success"`, so everything else is a failure: no order row is written, the subscriber stays "unpaid", and the next run (or the job framework's automatic retry) charges the card again. When the callback finally says success, it matches no stored order because the `merchant_oid` was random and never saved.
**How to test:** Read the response handling of every PayTR request; mock a `wait_callback` answer and run the charge job twice.
**Pass:** Three outcomes: success, failed, pending. Pending writes an order row in a pending state with the `merchant_oid`, and no new charge is made for that subscriber until the pending row is settled by the status inquiry or the callback.
**Fix:** Store `merchant_oid` before the request; map `wait_callback` to pending; settle pending rows via the status inquiry API before charging again. See `PAY-014`.

### PAYTR-002 · Callback marks the attempt done before the rest is saved
**Severity:** P0
**Why it breaks:** The callback handler first flips a "processed" or `IsSuccess` flag on the payment token row, then creates the subscription, order and access flag in separate saves. If a later step throws, PayTR retries, the handler sees the flag, answers "OK" and skips. The card was charged; the user never gets access.
**How to test:** Make the order insert fail (constraint, DB stopped) after the token row is saved, then replay the same callback.
**Pass:** The replay writes the missing rows, or nothing was saved the first time; "OK" is returned only after everything committed.
**Fix:** One transaction for the whole success path; set the "processed" flag last, inside it. See `PAY-012`, `UNI-021`.

### PAYTR-003 · Merchant salt written to the logs
**Severity:** P0
**Why it breaks:** The `paytr_token` HMAC input is a concatenation that ends with the merchant salt. AI logs that string "to debug hash mismatches", so the salt sits in every log file and log service. Anyone with the salt and key can forge callbacks.
**How to test:** `git grep -n` for log calls near the token concatenation; search the logs for the salt's first characters.
**Pass:** Only the resulting hash (or nothing) is logged.
**Fix:** Log the inputs without the salt, or the hash only; rotate the salt if it was logged.

### PAYTR-004 · Optional request fields switched on without the merchant feature
**Severity:** P0
**Why it breaks:** AI adds `utoken` / `store_card` (saved cards) or another optional field to the payment request because the docs mention it. If the feature isn't enabled for the merchant account, every payment fails. Health checks stay green, so it can go unnoticed for days.
**How to test:** After any change to the request fields, make one real payment in production and compare the daily success count with the day before.
**Pass:** Fields that depend on an account feature are behind a config flag that is off until PayTR confirms the feature; a real payment passed after the deploy.
**Fix:** Feature-flag the field; alert on a drop in successful payments. See `PAY-021`.

### PAYTR-005 · Saved-card token read from the latest order, whatever its status
**Severity:** P1
**Why it breaks:** The recurring job reads the user's `utoken` from the most recent order row. Once failed or pending attempts are also written (they should be), the latest row has an empty token or a `merchant_oid` in that column, and the subscriber can never be charged again.
**How to test:** Create a failed attempt after a successful one and run the job for that user.
**Pass:** The token comes from the latest **successful** payment (or from a dedicated card table).
**Fix:** Filter by the paid status, or keep tokens in their own table. See `PAY-017`.
