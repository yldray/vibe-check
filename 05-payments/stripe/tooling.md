# Stripe — tooling

| Purpose | Tool |
|---|---|
| Local webhooks | Stripe CLI: `stripe listen --forward-to`, `stripe trigger <event>` |
| Renewals and dunning | Test clocks |
| Failure cases | Stripe test cards (declined, insufficient funds, 3DS, delayed methods) |
| Monitoring | Webhook delivery failures in the dashboard, alerted |
