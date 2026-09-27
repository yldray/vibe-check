# Android (Kotlin) — AI audit prompts

Paste into Claude Code, Cursor or any agent:

```
Audit this Android (Kotlin) project for production readiness.
Check: main-thread network or DB work, state lost on rotation or process death, targetSdk,
cleartext traffic, exported components, tokens in SharedPreferences or logs, WebView bridges,
background work outside WorkManager, notification permission and channels, edge-to-edge insets,
R8 release build, Auto Backup rules.
Output a table: severity (P0/P1/P2), file:line, issue, fix.
Do not change code until I approve.
```
