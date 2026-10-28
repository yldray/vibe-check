# Android (Kotlin) — pre-launch test cases

- [ ] `AND-004` **P0** Release build with R8 tested (no missing classes)
- [ ] `AND-005` **P1** Back gesture / predictive back works
- [ ] `AND-013` **P1** `applicationId` is final: it can never change after the first Play upload
- [ ] `AND-014` **P1** Tested on the minimum SDK, the latest Android version and a low-end device
- [ ] `AND-015` **P1** Auto Backup reviewed: tokens and personal data are excluded (`dataExtractionRules` / `fullBackupContent`)
- [ ] `AND-016` **P2** Dynamic color is a decision: the Compose project template ships `dynamicColor: Boolean = true`, which replaces the brand colors with colors taken from the wallpaper on Android 12+. Turn it off for a branded app, or keep it on purpose with the `Build.VERSION.SDK_INT >= Build.VERSION_CODES.S` guard and static light and dark schemes for older versions. Test: grep `dynamicColor` and `dynamicLightColorScheme`; open the app on an Android 12+ device with a strongly colored wallpaper
