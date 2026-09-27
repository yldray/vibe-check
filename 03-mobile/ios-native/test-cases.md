# iOS (Swift) — pre-launch test cases

- [ ] `IOS-004` **P0** TestFlight build tested on real device
- [ ] `IOS-005` **P1** Dynamic Type and dark mode
- [ ] `IOS-013` **P0** The App Store build uses the Release configuration; debug-only code and test endpoints sit behind `#if DEBUG`
- [ ] `IOS-014` **P1** Background modes in `Info.plist` match what the app really does (App Review guideline 2.5.4)
- [ ] `IOS-015` **P1** dSYMs are uploaded to your crash tool, so crash reports show symbols
- [ ] `IOS-016` **P0** If the app uses CloudKit, the schema is deployed to the Production environment in CloudKit Console before release (TestFlight and App Store builds use Production)
