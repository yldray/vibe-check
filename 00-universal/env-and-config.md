# Environment and config

- [ ] `ENV-001` **P0** `.env` in `.gitignore`
- [ ] `ENV-002` **P0** `.env.example` with every key (no values)
- [ ] `ENV-003` **P0** Separate keys, bot/app tokens, webhooks and databases for dev / CI / staging / prod; production config points at no test host. Test: start the app locally and run the CI evals: production keeps receiving its messages and its balance doesn't move; grep production config for staging/test domains
- [ ] `ENV-004` **P0** Debug / verbose logging off in prod
- [ ] `ENV-005` **P0** App fails fast on startup if a required setting is missing, empty or still a placeholder (`changeme`, `<DB>`, `__SET_AT_DEPLOY__`, `YOUR_…`), or still equals the dev value from the base config file. Test: start the production build with each required value removed, set to a placeholder, and with the DB unreachable. Pass: the process exits and names the key; no committed base config holds a working secret; startup logs which source (file, env, machine env var) each critical value came from, without the value
- [ ] `ENV-006` **P1** Client-exposed env vars (`NEXT_PUBLIC_`, `VITE_`, `EXPO_PUBLIC_`) contain nothing secret
- [ ] `ENV-007` **P1** `.gitignore` has no inline comments: in `.env  # secrets` the comment is read as part of the pattern, so nothing is ignored
- [ ] `ENV-008` **P1** OTP codes, sessions, rate-limit counters and runtime settings survive a restart and work across instances (database or shared cache, not process memory). Test: request an OTP, restart, submit it; use up a limit, restart, try again
