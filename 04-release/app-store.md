# App Store release checklist

> Always verify against the [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/).

## P0
- [ ] Tested on real devices via TestFlight
- [ ] Demo account + notes provided in App Review information (if login is required)
- [ ] Account deletion inside the app (if the app has accounts)
- [ ] Privacy nutrition labels match real data collection (including SDKs)
- [ ] Privacy manifest (PrivacyInfo.xcprivacy) included where required
- [ ] Every permission has a clear usage description
- [ ] No placeholder content, broken links, "beta" or "test" wording
- [ ] Third-party social login offered → an equivalent privacy-focused login option is also offered (check guideline 4.8)
- [ ] Digital goods and subscriptions follow in-app purchase rules for your regions
- [ ] Privacy policy URL in App Store Connect and inside the app

## P1
- [ ] Screenshots for required device sizes
- [ ] Restore purchases button (if IAP)
- [ ] Works on the oldest iOS version you support
- [ ] Phased release enabled
