# Environment and config

- [ ] `ENV-001` **P0** `.env` in `.gitignore`
- [ ] `ENV-002` **P0** `.env.example` with every key (no values)
- [ ] `ENV-003` **P0** Separate keys for dev / staging / prod
- [ ] `ENV-004` **P0** Debug / verbose logging off in prod
- [ ] `ENV-005` **P1** App fails fast on startup if a required env var is missing
- [ ] `ENV-006` **P1** Client-exposed env vars (`NEXT_PUBLIC_`, `VITE_`, `EXPO_PUBLIC_`) contain nothing secret
- [ ] `ENV-007` **P1** `.gitignore` has no inline comments: in `.env  # secrets` the comment is read as part of the pattern, so nothing is ignored
