# Android (Kotlin) — chronic issues

### AND-001 · State lost on rotation / process death
**Severity:** P1
**Why it breaks:** State in Activity fields, not ViewModel/SavedState.
**How to test:** Rotate; enable 'Don't keep activities'.
**Pass:** State restored.
**Fix:** ViewModel + SavedStateHandle.

### AND-002 · ANR from main thread work
**Severity:** P0
**Why it breaks:** Network or DB on the main thread.
**How to test:** StrictMode; test on a low-end device.
**Pass:** No ANR.
**Fix:** Coroutines on IO dispatcher.

### AND-003 · Target SDK below Play requirement
**Severity:** P0
**Why it breaks:** Old template targets an old API level.
**How to test:** Compare targetSdk with the current Play requirement.
**Pass:** Meets requirement.
**Fix:** Update targetSdk and test behavior changes.

### AND-006 · Cleartext traffic in release
**Severity:** P1
**Why it breaks:** To reach a local `http://` API, AI sets `android:usesCleartextTraffic="true"` or a network security config that allows cleartext, and it ships.
**How to test:** Check `AndroidManifest.xml` and `res/xml/network_security_config.xml` of the release build.
**Pass:** No cleartext in release; any localhost exception lives only in the debug source set.
**Fix:** HTTPS everywhere; debug-only overrides in `src/debug`.

### AND-007 · Exported components without protection
**Severity:** P1
**Why it breaks:** AI marks activities, services, receivers or content providers `android:exported="true"`, so other apps can start them or read the provider.
**How to test:** List exported components in the merged manifest; start one from outside with `adb shell am start -n <package>/<activity>`.
**Pass:** Only the launcher and intended entry points are exported; providers are not exported or are permission-protected.
**Fix:** `exported="false"` by default, permissions on the rest, and validate incoming intents.

### AND-008 · Tokens in plain storage or logs
**Severity:** P1
**Why it breaks:** AI stores tokens in plain SharedPreferences and logs responses with `Log.d`; logcat and crash reports then hold them.
**How to test:** On a debug build, `adb shell run-as <package> cat shared_prefs/*.xml`; watch `adb logcat` while logging in with a release build.
**Pass:** Tokens are encrypted with a key held in the Android Keystore; no tokens or personal data in release logs.
**Fix:** Keystore-backed encryption; strip debug logs from release (R8 rules or a logger that does nothing in release).

### AND-009 · WebView bridges open to any page
**Severity:** P1
**Why it breaks:** AI enables JavaScript, adds `addJavascriptInterface` and loads any URL, so a third-party page can call into your app.
**How to test:** Review every `WebView` setup; navigate it to an external URL.
**Pass:** Only your own URLs load; no JavaScript interface is exposed to other origins.
**Fix:** Restrict URLs, remove bridges or check the origin before handling calls.

### AND-010 · Background work that gets killed
**Severity:** P1
**Why it breaks:** AI runs uploads and sync in threads or coroutines tied to an Activity; Android stops them once the app is in the background.
**How to test:** Start an upload, background the app, then force idle mode (`adb shell dumpsys deviceidle force-idle`).
**Pass:** The work finishes or resumes.
**Fix:** WorkManager for deferrable work; a foreground service with the right type (required since Android 14) for user-visible work.

### AND-011 · Notifications that never show
**Severity:** P1
**Why it breaks:** Android 13+ needs the `POST_NOTIFICATIONS` runtime permission and Android 8+ needs channels; AI forgets one or both.
**How to test:** Fresh install on Android 13 or later, then trigger a notification.
**Pass:** The permission is asked in context and the notification appears on the right channel.
**Fix:** Create channels at startup; request `POST_NOTIFICATIONS` when the user turns notifications on.

### AND-012 · Content under the system bars
**Severity:** P1
**Why it breaks:** Apps targeting Android 15 (API 35) are edge-to-edge by default; AI layouts ignore window insets, so content hides under the status and navigation bars.
**How to test:** Run on Android 15+ with gesture navigation and with 3-button navigation.
**Pass:** Nothing is hidden or untappable under the system bars.
**Fix:** Handle insets (`WindowInsetsCompat`, or `safeDrawingPadding()` in Compose).
