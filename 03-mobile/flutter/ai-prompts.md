# Flutter — AI audit prompts

Paste into Claude Code, Cursor or any agent:

```
Audit this Flutter project for production readiness.
Check: INTERNET permission in the main AndroidManifest, release signing (no debug key, no keystore
or passwords in git), awaits before runApp, String.fromEnvironment defaults and http:// URLs, secrets
in Dart code or bundled assets (.env), in_app_purchase completePurchase, permission_handler setup,
! and late on API data, BuildContext after await, background handlers without
@pragma('vm:entry-point'), FlutterError.onError + PlatformDispatcher.onError and symbol upload,
timeouts on http / dio, tokens in shared_preferences or logs, setState after dispose, FutureBuilder
futures created in build, ListView(children:) for long lists, com.example ids, targetSdk.
Output a table: severity (P0/P1/P2), file:line, issue, fix.
Do not change code until I approve.
```
