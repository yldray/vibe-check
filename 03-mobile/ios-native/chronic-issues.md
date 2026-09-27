# iOS (Swift) — chronic issues

> 🌱 Seeded list. Contributions welcome.

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
