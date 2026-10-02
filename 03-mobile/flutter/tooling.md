# Flutter — tooling

| Purpose | Tool |
|---|---|
| Unit / widget | flutter_test |
| Integration | integration_test, Patrol |
| E2E | Maestro |
| Lint | `flutter analyze` with `flutter_lints` (`use_build_context_synchronously`, `avoid_print`) |
| Dependencies | `flutter pub outdated`; `flutter pub get` lists discontinued packages |
| Release builds | `flutter run --release`, `flutter build appbundle --analyze-size` |
| Signing | `keytool -printcert -jarfile <aab>`, `keytool -list -v` for SHA-1 / SHA-256 |
| Crash reports | firebase_crashlytics or sentry_flutter; `firebase crashlytics:symbols:upload`, `flutter symbolize` |
| Logs | `adb logcat` on a release build |
| Performance | Flutter DevTools (rebuild stats, "Highlight oversized images", memory) |
