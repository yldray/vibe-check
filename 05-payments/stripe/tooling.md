# Stripe — tooling

| Purpose | Tool |
|---|---|
| Local webhooks | Stripe CLI: `stripe listen --forward-to`, `stripe trigger <event>` |
| Renewals and dunning | Test clocks |
| Failure cases | Stripe test cards (declined, insufficient funds, 3DS, delayed methods) |
| Monitoring | Webhook delivery failures in the dashboard, alerted |
| Live endpoints | `stripe webhook_endpoints list --live` (url, status, enabled_events, api_version) |
| 3D Secure | Test card `4000002500003155` (fail or close the challenge) |
