# iOS (Swift) — chronic issues

### IOS-001 · UI updated off the main thread
**Severity:** P0
**Why it breaks:** Callbacks update UI from background threads.
**How to test:** Main Thread Checker in Xcode.
**Pass:** No warnings.
**Fix:** @MainActor / DispatchQueue.main.

### IOS-002 · Missing usage description strings
**Severity:** P0
**Why it breaks:** Crash or rejection when asking for camera, location, etc.
**How to test:** Trigger every permission on a fresh install.
**Pass:** Clear prompts, no crash.
**Fix:** Add NS*UsageDescription keys.

### IOS-003 · Missing privacy manifest
**Severity:** P0
**Why it breaks:** Required-reason APIs used without PrivacyInfo.xcprivacy.
**How to test:** Check App Store Connect warnings on upload.
**Pass:** No warnings.
**Fix:** Add a privacy manifest with declared reasons.

### IOS-006 · Tokens in UserDefaults
**Severity:** P1
**Why it breaks:** AI stores tokens and passwords in `UserDefaults`, a plain plist that is also included in backups.
**How to test:** Open the app container on the simulator (`xcrun simctl get_app_container booted <bundle-id> data`) and read `Library/Preferences`.
**Pass:** Secrets live in the Keychain with a fitting accessibility (e.g. `kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly`).
**Fix:** Move them to the Keychain.

### IOS-007 · Keychain survives reinstall
**Severity:** P1
**Why it breaks:** Keychain items stay after the app is deleted. After a reinstall the app finds the old token and shows the previous user, or crashes on stale data. See `MOB-019`.
**How to test:** Log in, delete the app, reinstall and open it.
**Pass:** A clean first-run state.
**Fix:** On first launch (a flag in `UserDefaults`, which is deleted with the app), clear your Keychain items.

### IOS-008 · App Transport Security turned off
**Severity:** P1
**Why it breaks:** AI adds `NSAllowsArbitraryLoads = YES` to `Info.plist` to make one `http://` call work; it ships and App Review may ask why.
**How to test:** Check `NSAppTransportSecurity` in `Info.plist`.
**Pass:** No arbitrary loads; only narrow, justified per-domain exceptions.
**Fix:** HTTPS; per-domain exceptions only where you can't avoid them.

### IOS-009 · Retain cycles in closures
**Severity:** P1
**Why it breaks:** AI captures `self` strongly in escaping closures (network callbacks, timers, Combine sinks), so screens are never freed.
**How to test:** Open and close a screen 10 times, then check Xcode's Memory Graph or Instruments → Leaks.
**Pass:** The screen is deallocated (`deinit` runs).
**Fix:** `[weak self]`; cancel timers and subscriptions when the screen goes away.

### IOS-010 · Background work that never finishes
**Severity:** P1
**Why it breaks:** Uploads and sync run on a default `URLSession` or a plain `Task`; iOS suspends the app seconds after it goes to the background.
**How to test:** Start an upload or sync, background the app and lock the phone.
**Pass:** The work finishes or resumes.
**Fix:** A background `URLSession`, `BGTaskScheduler` (with `BGTaskSchedulerPermittedIdentifiers` in `Info.plist`), or `beginBackgroundTask` for short work.

### IOS-011 · Push works in debug, not in TestFlight
**Severity:** P1
**Why it breaks:** Debug builds use the APNs sandbox and TestFlight / App Store builds use production. AI configures only one, and sends the device token to the server just once although it can change.
**How to test:** Install a TestFlight build and send a push from your server.
**Pass:** It arrives, and the server has the current token after a reinstall.
**Fix:** Send pushes to the environment that matches the build; send the token to the server on every launch.

### IOS-012 · Concurrency warnings silenced
**Severity:** P2
**Why it breaks:** To get past Swift 6 strict concurrency errors, AI sprinkles `@unchecked Sendable` and `nonisolated(unsafe)`, hiding real data races.
**How to test:** Build with complete concurrency checking; search for `@unchecked Sendable` and `nonisolated(unsafe)`.
**Pass:** No warnings, and every unchecked annotation has a written reason.
**Fix:** Isolate shared state with actors or `@MainActor`.
