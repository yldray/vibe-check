# Mobile — common checks

- [ ] `MOB-001` **P0** No secrets in the app bundle
- [ ] `MOB-002` **P0** Tested on a real device, not only emulator / simulator
- [ ] `MOB-003` **P0** Account deletion inside the app (if the app has accounts)
- [ ] `MOB-004` **P0** Crash reporting connected (Crashlytics, Sentry)
- [ ] `MOB-005` **P1** Offline / bad network: no crash, clear message, retry
- [ ] `MOB-006` **P1** Permissions asked in context, with a clear reason; denial handled
- [ ] `MOB-007` **P1** Deep links open the right screen (cold and warm start)
- [ ] `MOB-008` **P1** Push notifications: permission, token refresh, tap opens right screen
- [ ] `MOB-009` **P1** Background → foreground keeps state
- [ ] `MOB-010` **P1** Small screen, large screen, notch, dark mode, large font
- [ ] `MOB-011` **P1** Force update / minimum version strategy
