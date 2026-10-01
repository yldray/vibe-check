# Payment providers

Provider-specific checks. Read them **on top of** `00-universal/payments.md`,
which holds the rules every provider shares (price from the server, access from
the webhook, pending results, renewal jobs, double charges).

| Detected | Folder |
|---|---|
| PayTR (`paytr.com` API calls, `paytr_token`, `merchant_oid`) | [`paytr/`](paytr/) |
| iyzico (`iyzipay` SDK, `api.iyzipay.com`) | [`iyzico/`](iyzico/) |
| Stripe (`stripe` SDK, `api.stripe.com`, `@stripe/stripe-js`) | [`stripe/`](stripe/) |

In-app purchases (App Store, Google Play) are in `00-universal/payments.md`
(`PAY-003`, `PAY-018`) and the store rules in `04-release/`.

Each folder has the same four files as a stack folder: `chronic-issues.md`
(bugs AI keeps writing), `test-cases.md` (pre-launch checks), `ai-prompts.md`
and `tooling.md`.
