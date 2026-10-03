# App Store release checklist

> Always verify against the [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/).

## P0
- [ ] `APPSTORE-001` Tested on real devices via TestFlight
- [ ] `APPSTORE-002` Demo account + notes provided in App Review information (if login is required)
- [ ] `APPSTORE-003` Account deletion inside the app (if the app has accounts)
- [ ] `APPSTORE-004` Privacy nutrition labels match real data collection (including SDKs)
- [ ] `APPSTORE-005` Privacy manifest (PrivacyInfo.xcprivacy) included where required
- [ ] `APPSTORE-006` Every permission has a clear usage description
- [ ] `APPSTORE-007` No placeholder content, broken links, "beta" or "test" wording
- [ ] `APPSTORE-008` Third-party social login offered → an equivalent privacy-focused login option is also offered (check guideline 4.8)
- [ ] `APPSTORE-009` Digital goods and subscriptions follow in-app purchase rules for your regions
- [ ] `APPSTORE-010` Privacy policy URL in App Store Connect and inside the app
- [ ] `APPSTORE-015` Subscriptions: the paywall shows what the user gets, the price, the billing period and that it renews automatically, before purchase (guideline 3.1.2(c) and Schedule 2 of the Apple Developer Program License Agreement)
- [ ] `APPSTORE-017` `UIBackgroundModes` lists only modes the app really uses; an unused `audio` mode is rejected under [Guideline 2.5.4](https://developer.apple.com/app-store/review/guidelines/#software-requirements). AI often adds `audio` "so AirPlay keeps playing when the screen locks" while background playback is off in the player; compare `UIBackgroundModes` with the player setting and the audio session category
- [ ] `APPSTORE-018` No button, link or call to action to buy outside the app on any account or plan type, including the review demo account, except where Apple allows it for your storefront ([Guideline 3.1.1](https://developer.apple.com/app-store/review/guidelines/#in-app-purchase))
- [ ] `APPSTORE-019` Ad and analytics SDK tracking flags follow the App Tracking Transparency answer: nothing hard-sets "tracking enabled" at startup (e.g. `setAdvertiserTrackingEnabled(true)`), and the ATT prompt is requested only once the app is `active` (requested at launch it is silently skipped) ([Guideline 5.1.2](https://developer.apple.com/app-store/review/guidelines/#data-collection-and-storage)). Test: fresh install shows the prompt; deny → the SDK flag is false

## P1
- [ ] `APPSTORE-011` Screenshots for required device sizes
- [ ] `APPSTORE-012` Restore purchases button (if IAP)
- [ ] `APPSTORE-013` Works on the oldest iOS version you support
- [ ] `APPSTORE-014` Phased release enabled
- [ ] `APPSTORE-016` Subscriptions: the paywall has a close button that is easy to see. There is no explicit rule for it, but apps that trick users into subscribing are removed (guideline 3.1.2(a))
- [ ] `APPSTORE-020` App Store Server Notifications v2 URLs are set for both Production and Sandbox, and "Request a test notification" reaches your server and is logged (see `PAY-024`)
