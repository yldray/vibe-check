# iyzico — chronic issues

### IYZICO-001 · Checkout Form result trusted without `retrieve`
**Severity:** P0
**Why it breaks:** The Checkout Form posts a `token` to your callback URL. AI marks the order paid as soon as the callback arrives, without calling the retrieve endpoint and checking `paymentStatus`, `paidPrice` and the `basketId` / `conversationId`. A failed payment, or a token from another order, unlocks access.
**How to test:** Post a token from a failed or unrelated payment to the callback.
**Pass:** Nothing unlocks; the order is marked paid only after `retrieve` returns `SUCCESS` with the expected price and basket.
**Fix:** Always call retrieve server-side and compare price, currency and basket/conversation id with your order. See `PAY-002`, `PAY-004`.

### IYZICO-002 · Your job charges what iyzico already charges
**Severity:** P0
**Why it breaks:** The app has both iyzico Subscription API plans (iyzico charges them) and saved-card charges (`cardUserKey`) run by your own renewal job. AI writes the job's selection from "subscription expired" alone, so it also picks subscribers whose renewal iyzico handles, and the user is charged twice.
**How to test:** List subscribers by source; run the renewal job's selection query and check that no iyzico-managed subscription is in it.
**Pass:** The job selects only subscriptions it owns, by an explicit source/provider column.
**Fix:** Filter on the provider that owns the renewal; never on dates alone. See `PAY-015`, `PAY-019`.

### IYZICO-003 · Subscription state known only from a nightly sync
**Severity:** P1
**Why it breaks:** AI polls iyzico once a night instead of receiving webhooks. Cancellations and failed renewals arrive up to a day late, and when the sync job breaks, nobody notices: cancelled users keep access and revenue reports go stale.
**How to test:** Cancel a sandbox subscription and check how long until your DB changes; stop the sync job and check that someone is alerted.
**Pass:** Webhooks (signature verified) update state within minutes; the sync is a safety net with a failure alert.
**Fix:** Register iyzico webhooks, verify their signature, process them idempotently; alert when the sync fails or finds drift.

### IYZICO-004 · Customers matched by e-mail
**Severity:** P1
**Why it breaks:** The sync matches iyzico customers to users by e-mail. E-mails change, differ in case, or belong to several rows (old deleted accounts), so a cancellation lands on the wrong user or on none.
**How to test:** Change a user's e-mail, or create a second row with the same e-mail, then run the sync.
**Pass:** Matching uses the customer/subscription reference code stored at sign-up.
**Fix:** Store iyzico reference codes on your subscription row and match on them. See `UNI-020`.

### IYZICO-010 · 3DS callback taken as the payment
**Severity:** P0
**Why it breaks:** In the API 3DS flow, `threedsInitialize` returns `threeDSHtmlContent`; after the bank page, the browser posts `status`, `paymentId`, `conversationData`, `conversationId`, `mdStatus` and `signature` to your `callbackUrl`. AI marks the order paid when `status=success`. But no money moves until you call the 3DS auth endpoint (`threedsPayment.create`), an `mdStatus` other than `1` means 3DS failed, and anyone can post `status=success` to that URL.
**How to test:** In the sandbox, pay with `4131111111111117` (success but `mdStatus` 0) and `4141111111111115` (`mdStatus` 4); post `status=success&paymentId=1&mdStatus=1` to the callback with curl.
**Pass:** None of these marks an order paid; a real payment is marked paid only after `threedsPayment` returns `success` with the expected `paidPrice`, `basketId` and `conversationId`.
**Fix:** Verify the callback `signature` (hex HMAC-SHA256 with the secret key over `conversationData:conversationId:mdStatus:paymentId:status`), require `mdStatus == "1"`, call `threedsPayment` once per `paymentId` with its `conversationData`, and compare the response with the order. See `IYZICO-001`, `PAY-002`.

### IYZICO-011 · Card numbers pass through your server
**Severity:** P0
**Why it breaks:** Asked for "our own card form", AI posts `cardNumber`, `expireMonth`, `expireYear` and `cvc` from the browser to your API and builds `paymentCard` for `payment.create` or `threedsInitialize.create`, exactly as the SDK samples do. Your servers now handle card data, which moves you from PCI DSS SAQ A to SAQ D, and request logs, error trackers and "payment attempt" rows quietly keep full card numbers and CVCs.
**How to test:** `grep -rnE "paymentCard|cardNumber|cvc"` in server code. Pay once in the sandbox with `5528790000000008`, then search logs, error-tracker events and the database for that number.
**Pass:** Cards are typed only into iyzico's Checkout Form or Pay with iyzico, saved cards are charged by `cardUserKey` + `cardToken`, and the test number appears nowhere.
**Fix:** Use the Checkout Form (`checkoutFormInitialize`, then retrieve as in `IYZICO-001`); purge logs that hold card data.

### IYZICO-012 · Callback rejected by CSRF or a missing session
**Severity:** P0
**Why it breaks:** Checkout Form and 3DS results come back as a form POST that the customer's browser sends from iyzico's page to your `callbackUrl`. AI puts that route behind CSRF protection and login, reads the order from the session, or parses the body as JSON. Session cookies with `SameSite=Lax` aren't sent on a cross-site POST (Chrome still sends cookies without a SameSite attribute for 2 minutes after they're set, so a quick test passes), so real customers get 419, 403 or a login redirect, and with the Checkout Form their card is already charged while the order stays unpaid.
**How to test:** Log in, wait more than 2 minutes, pay in the sandbox and read the callback's status code in the server log. Check the CSRF exemption list; grep the callback for `session`, `req.user`, `auth()` and `json()`.
**Pass:** The callback works without a session, reads the form-encoded `token` / `paymentId`, finds the order by `token` or `conversationId`, confirms it with iyzico and redirects (303) to a result page.
**Fix:** Exempt the callback from CSRF and auth, key orders by the posted token and `conversationId`, parse form data, and trust iyzico's retrieve result or signature, not the cookie.

### IYZICO-013 · SDK sample buyer sent for every customer
**Severity:** P1
**Why it breaks:** AI copies the SDK sample request and changes only the prices, so every payment names the same buyer: `John Doe`, buyer id `BY789`, identity number `74300864791`, `email@email.com`, `+905350000000`, IP `85.34.78.112`, the address "Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1", and sometimes `callbackUrl` `https://www.merchant.com/callback`. iyzico requires the real identity number (MASAK rules) and the buyer's IP; when AI does fill `buyer.ip`, it is often the proxy's address.
**How to test:** `grep -rnE "74300864791|85\.34\.78\.112|email@email\.com|905350000000|Nidakule|BY789|merchant\.com/callback"`. Log one sandbox request's buyer block (masked) and compare `buyer.ip` with your public IP.
**Pass:** No sample values; buyer fields come from the user and the order; `buyer.ip` is the client IP read through trusted proxy headers.
**Fix:** Map the buyer from your user record and collect the identity number where required; read the client IP once, as in `SEC-007`. See `UNI-006`.
