# Firebase — tooling

| Purpose | Tool |
|---|---|
| Local stack | Firebase Emulator Suite (it doesn't require composite indexes; test queries against a real project too) |
| Rules tests | `@firebase/rules-unit-testing` |
| Rules debugging | Rules Playground in the console |
| Abuse protection | App Check |
| Cost control | Google Cloud Billing budget alerts; Firebase spend caps (Usage and billing → Accounts & budgets) pause a service |
| Config and secrets | Params and `defineSecret` (Cloud Secret Manager); `firebase functions:config:export` to leave `functions.config()` |
| API keys | Google Cloud console → APIs & Services → Credentials (API and application restrictions) |
| Account deletion | Delete User Data extension |
