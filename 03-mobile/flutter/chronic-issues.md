# Flutter — chronic issues

### FLT-001 · setState after dispose
**Severity:** P1
**Why it breaks:** Async work finishes after the widget is gone.
**How to test:** Leave the screen during a request.
**Pass:** No errors.
**Fix:** Check `mounted`; cancel work.

### FLT-002 · Rebuilding the whole tree
**Severity:** P2
**Why it breaks:** State high in the tree; no const widgets.
**How to test:** Flutter DevTools rebuild stats.
**Pass:** Minimal rebuilds.
**Fix:** const widgets, scoped state.

### FLT-003 · Secrets in Dart code
**Severity:** P0
**Why it breaks:** API keys hardcoded or in --dart-define for private keys.
**How to test:** Search the compiled app for keys.
**Pass:** No private keys.
**Fix:** Backend proxy.

### FLT-006 · No INTERNET permission in the release build
**Severity:** P0
**Why it breaks:** `flutter create` declares `android.permission.INTERNET` only in `android/app/src/debug/` and `src/profile/AndroidManifest.xml`, because the tool needs it for hot reload; `src/main/AndroidManifest.xml` has none. Everything works in `flutter run`, but the release APK / AAB can't reach the network (unless a plugin happens to merge the permission in), so every API call fails for Android users.
**How to test:** `grep -n "permission.INTERNET" android/app/src/main/AndroidManifest.xml`. If it's missing, run `flutter run --release` on an Android device and open a screen that calls the API.
**Pass:** The main manifest declares `INTERNET` and the release build loads data.
**Fix:** Add `<uses-permission android:name="android.permission.INTERNET"/>` to `android/app/src/main/AndroidManifest.xml`.

### FLT-007 · Release build signed with the debug key
**Severity:** P0
**Why it breaks:** The template's `release` block says `// TODO: Add your own signing config` and signs with `signingConfigs.getByName("debug")`. AI leaves it, or falls back to the debug config when `key.properties` is missing in CI, and Play doesn't accept debug-signed apps. AI also commits `key.properties` or the `.jks`, or writes the passwords inline in Gradle.
**How to test:** In `android/app/build.gradle(.kts)`, no path from the `release` build type reaches `getByName("debug")` or `signingConfigs.debug`. `keytool -printcert -jarfile build/app/outputs/bundle/release/*.aab | grep "Android Debug"` prints nothing. `git ls-files | grep -E "key\.properties|\.jks$|\.keystore$"` is empty and no Gradle file holds a `storePassword` literal.
**Pass:** The bundle is signed with the upload key; no key or password is in git.
**Fix:** A `release` signing config that reads `key.properties` or CI secrets and fails the build when they're missing; keep the template's `android/.gitignore` lines. See `PLAY-002`, `UNI-001`.

### FLT-008 · Startup work before `runApp` freezes the splash screen
**Severity:** P0
**Why it breaks:** AI awaits SDK setup, a remote-config fetch, a token refresh or an API call in `main()` before `runApp()`, with no timeout or catch. The native splash stays until Flutter draws its first frame, so if one step throws or hangs (no network, backend down, bad config), users see a white or black screen forever, and crash reporting may not be set up yet. A `FlutterNativeSplash.preserve()` whose `remove()` is never reached does the same.
**How to test:** List every `await` in `main()` before `runApp(` and every path to `FlutterNativeSplash.remove()`. Start the release build in airplane mode, then again with the API host blocked.
**Pass:** A Flutter screen (loading, offline or error) appears within a few seconds both times.
**Fix:** Before `runApp`, only fast local setup (binding, crash reporting); do the rest inside the app with a timeout and an error screen; call `remove()` in `finally`.

### FLT-009 · Release build calls a dev host or plain HTTP
**Severity:** P0
**Why it breaks:** AI writes `const String.fromEnvironment('API_URL', defaultValue: 'http://10.0.2.2:8000')`, and the store build runs without `--dart-define`, so it ships the dev default (without `const`, `String.fromEnvironment` can also return the default in release builds). `http://` URLs keep working in release: Android's cleartext rule and iOS ATS don't apply to Dart's own sockets (`package:http`, dio, `Image.network`), so tokens travel unencrypted while the manifest and Info.plist checks (`AND-006`, `IOS-008`) pass.
**How to test:** `grep -rn "fromEnvironment" lib/`: every call is `const` and no `defaultValue` is `localhost`, `127.0.0.1`, `10.0.2.2`, a LAN IP or a staging host. `grep -rn "http://" lib/`. Read the release build command (CI, Fastlane, Codemagic) for `--dart-define` or `--dart-define-from-file`.
**Pass:** The release base URL is the production `https://` host, set by the release command; an empty value stops the app at startup.
**Fix:** `const` reads with an empty default plus a startup check, `--dart-define-from-file` in the release job, HTTPS only. See `ENV-005`, `UNI-018`.

### FLT-010 · Secrets shipped as Flutter assets
**Severity:** P0
**Why it breaks:** AI adds `flutter_dotenv`, puts API secrets in `.env` and lists `.env` under `flutter: assets:` in `pubspec.yaml`, as the package setup says. Assets are plain files under `flutter_assets/` in the APK and IPA, and anyone can unzip them. Service-account JSON, `.pem` and `.p12` files dropped in `assets/` leak the same way; `envied` with `obfuscate: true` only makes values harder to read.
**How to test:** Read the `assets:` list in `pubspec.yaml` for `.env*`, `*.json`, `*.pem`, `*.p12` and `*.key`. Build, run `unzip -l build/app/outputs/flutter-apk/*.apk | grep flutter_assets/` and open each config file.
**Pass:** Bundled files hold only public values (base URLs, publishable keys).
**Fix:** Call the APIs that need secrets from your backend; ship only public config. See `FLT-003`, `MOB-001`.

### FLT-011 · Store purchases never completed
**Severity:** P0
**Why it breaks:** With `in_app_purchase`, AI listens to `purchaseStream`, unlocks the content and stops there, never calling `completePurchase()` for purchases with `pendingCompletePurchase`. Google Play refunds and revokes purchases that aren't acknowledged within 3 days; on iOS the transaction comes back at every launch and buying the same product again fails.
**How to test:** `grep -rn "purchaseStream\|completePurchase" lib/`: every branch that handles a purchase (purchased, restored, error) completes it. Buy as a Play license tester (unacknowledged test purchases are refunded after 5 minutes) and check the purchase is still active after 10; in the iOS sandbox, buy, relaunch, then buy the same consumable again.
**Pass:** Each purchase is completed once, after server verification and delivery.
**Fix:** `if (p.pendingCompletePurchase) await InAppPurchase.instance.completePurchase(p);` after verifying and delivering. See `PAY-023`, `PAY-003`.

### FLT-012 · Permission requests that can never be granted
**Severity:** P1
**Why it breaks:** On Android, AI calls `Permission.storage.request()` before picking or saving photos; on Android 13+ the result is always denied, so the feature stays locked (image_picker needs no permission there at all). On iOS, permission_handler compiles out every permission you didn't enable: with CocoaPods that means a `PERMISSION_<NAME>=1` macro in the `Podfile`, and with Swift Package Manager the usage key in `Info.plist`. Without it the request returns denied and no prompt appears.
**How to test:** `grep -rn "Permission.storage\|manageExternalStorage" lib/`. For each `Permission.<x>` used in Dart, `ios/Runner/Info.plist` has its usage key, and if `ios/Podfile.lock` lists `permission_handler_apple`, the `Podfile` `post_install` sets its macro to `1`. On fresh installs of the Play build (Android 13+) and the TestFlight build, trigger every request.
**Pass:** Every request shows the system dialog.
**Fix:** `Permission.photos` / `videos` / `audio`, or the system picker with no permission; enable each iOS permission in the `Podfile` or `Info.plist`. See `MOB-006`, `IOS-002`.

### FLT-013 · Null checks and casts on API data
**Severity:** P1
**Why it breaks:** AI parses JSON with `json['name'] as String` and `data!`, reads `snapshot.data!` without checking for errors, fills `late` fields from async calls and validates with `assert()`. A missing field, a failed request or an early build then throws "Null check operator used on a null value", "type 'Null' is not a subtype of type 'String'" or `LateInitializationError`. Release builds remove asserts, and a build error shows a plain grey box instead of the red debug screen.
**How to test:** Grep models and widgets for `as String`, `as int`, `]!`, `.data!`, `late ` and `assert(`, and check that `ErrorWidget.builder` is set. Run the release build against responses with each optional field missing or `null`, and with the request failing.
**Pass:** Every screen shows a fallback or an error state, never a grey area.
**Fix:** Nullable model fields handled explicitly (don't invent values, see `UNI-016`), `snapshot.hasError` checks, real validation instead of `assert`, and a friendly `ErrorWidget.builder` that also reports the error.

### FLT-014 · `BuildContext` used after `await`
**Severity:** P1
**Why it breaks:** AI writes `await api.save(); Navigator.of(context).pop();` or shows a SnackBar after the `await`. If the user left the screen in the meantime, debug builds throw "Looking up a deactivated widget's ancestor is unsafe" and release builds hit a null check inside `Navigator.of`. When the lint fires, AI often adds `// ignore:` instead of fixing it.
**How to test:** `flutter analyze` reports no `use_build_context_synchronously` (it is in `flutter_lints`), and `grep -rn "use_build_context_synchronously" lib/ analysis_options.yaml` finds no ignore. Tap Save and press back before it finishes.
**Pass:** No lint hits, no ignores, no exception.
**Fix:** `if (!context.mounted) return;` after each `await`, before using `context`. See `FLT-001`.

### FLT-015 · Background handlers without an entry-point pragma
**Severity:** P1
**Why it breaks:** Native code calls some Dart functions directly: the `FirebaseMessaging.onBackgroundMessage` handler, flutter_local_notifications' `onDidReceiveBackgroundNotificationResponse` and Workmanager's `callbackDispatcher`. AI writes them as closures, methods or plain functions without `@pragma('vm:entry-point')`; the release compiler can tree-shake them and the VM refuses unannotated calls from native code. Background pushes and notification actions then do nothing, and because background paths are rarely tested, it ships that way.
**How to test:** Each function passed to those APIs is top-level or static, with `@pragma('vm:entry-point')` right above it. Kill the release app, send a data-only push, and tap a notification action.
**Pass:** The handler runs while the release app is killed.
**Fix:** A top-level handler with `@pragma('vm:entry-point')` that calls `Firebase.initializeApp()` before using Firebase. See `MOB-008`.

### FLT-016 · Crash reports miss async errors or can't be read
**Severity:** P1
**Why it breaks:** AI sets only `FlutterError.onError`, which catches build, layout and paint errors. Errors in `async` code (network calls, plugins, button handlers) go to `PlatformDispatcher.instance.onError` and are only printed. Builds made with `--obfuscate --split-debug-info` give unreadable stack traces unless the symbol files are uploaded, and the template's `.gitignore` excludes `app.*.symbols`, so they vanish with the CI workspace.
**How to test:** `grep -rn "FlutterError.onError\|PlatformDispatcher.instance.onError\|SentryFlutter.init" lib/` (`SentryFlutter.init` sets both). If the release command uses `--split-debug-info`, the job uploads the symbols (Crashlytics: `firebase crashlytics:symbols:upload`). Throw a test error in an `async` button handler of the release build.
**Pass:** The test error shows in the dashboard with Dart file names and line numbers.
**Fix:** Set both handlers (or use an SDK init that does) and upload or archive the symbols for every release. See `MOB-004`, `IOS-015`.

### FLT-017 · Network calls with no timeout
**Severity:** P1
**Why it breaks:** `package:http` has no timeout setting, `dart:io` `HttpClient.connectionTimeout` is `null` by default, and dio's `connectTimeout` and `receiveTimeout` default to no limit, so on a bad network the spinner never stops. AI also decides "offline" with `connectivity_plus`: since 6.0, `checkConnectivity()` returns a `List`, so `result == ConnectivityResult.none` is never true, and a Wi-Fi connection doesn't prove internet access anyway.
**How to test:** Every `http.` call has `.timeout(` or goes through one wrapper that adds it; every `BaseOptions(` sets `connectTimeout` and `receiveTimeout`; `grep -rn "== ConnectivityResult" lib/` is empty. Point the app at a host that accepts connections and never answers.
**Pass:** An error with a retry appears within about 20 seconds.
**Fix:** A timeout on every request; treat connectivity as a hint and consider the app offline only after a request fails. See `MOB-005`.

### FLT-018 · Tokens in `shared_preferences` or release logs
**Severity:** P1
**Why it breaks:** AI stores the access and refresh token with `shared_preferences` (plain `SharedPreferences` XML / `NSUserDefaults`), logs responses with `print` or `debugPrint` (both still print in release builds), and adds dio's `LogInterceptor` with `logPrint: debugPrint`, which logs request headers, `Authorization` included. With `flutter_secure_storage`, Android Auto Backup can restore the data without its key (`Failed to unwrap key`).
**How to test:** `grep -rn "setString(" lib/ | grep -iE "token|password|session"`, `grep -rn "print(\|LogInterceptor(" lib/`, `grep -n "avoid_print: false" analysis_options.yaml`. Watch `adb logcat` while logging in on a release build. If `flutter_secure_storage` is used, read `android:allowBackup` and the backup rules.
**Pass:** Secrets live only in `flutter_secure_storage`; release logs hold no tokens or personal data; secure-storage prefs are excluded from backup.
**Fix:** `flutter_secure_storage`; logs and `LogInterceptor` under `if (kDebugMode)`; exclude the secure-storage prefs from backup. See `AND-008`, `IOS-006`, `AND-015`.
