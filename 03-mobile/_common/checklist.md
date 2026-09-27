# Mobile — common checks

- [ ] **P0** No secrets in the app bundle
- [ ] **P0** Tested on a real device, not only emulator / simulator
- [ ] **P0** Account deletion inside the app (if the app has accounts)
- [ ] **P1** Offline / bad network: no crash, clear message, retry
- [ ] **P1** Permissions asked in context, with a clear reason; denial handled
- [ ] **P1** Deep links open the right screen (cold and warm start)
- [ ] **P1** Push notifications: permission, token refresh, tap opens right screen
- [ ] **P1** Background → foreground keeps state
- [ ] **P1** Small screen, large screen, notch, dark mode, large font
- [ ] **P1** Force update / minimum version strategy
- [ ] **P2** Crash reporting (Crashlytics, Sentry)
