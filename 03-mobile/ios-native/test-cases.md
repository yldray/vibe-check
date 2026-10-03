# iOS (Swift) — pre-launch test cases

- [ ] `IOS-004` **P0** TestFlight build tested on real device
- [ ] `IOS-005` **P1** Dynamic Type and dark mode
- [ ] `IOS-013` **P0** The App Store build uses the Release configuration; debug-only code and test endpoints sit behind `#if DEBUG`
- [ ] `IOS-014` **P1** Background modes in `Info.plist` match what the app really does (App Review guideline 2.5.4)
- [ ] `IOS-015` **P1** dSYMs are uploaded to your crash tool, so crash reports show symbols
- [ ] `IOS-016` **P0** If the app uses CloudKit, the schema is deployed to the Production environment in CloudKit Console before release (TestFlight and App Store builds use Production)
- [ ] `IOS-018` **P1** A native SDK left out of simulator builds (no arm64-simulator slice, so it is behind a build flag or `EXCLUDED_ARCHS[sdk=iphonesimulator*]`) is proven present in the archived store build: `otool -L` or `nm` on the archived binary before upload shows its symbols, and the build fails if the required flag is missing
