# iOS (Swift) — AI audit prompts

Paste into Claude Code, Cursor or any agent:

```
Audit this iOS (Swift) project for production readiness.
Check: UI updates off the main thread, usage description strings, privacy manifest,
tokens in UserDefaults, Keychain after reinstall, ATS exceptions, retain cycles in closures,
background tasks, APNs environment and token refresh, silenced concurrency warnings,
background modes, Release build config.
Output a table: severity (P0/P1/P2), file:line, issue, fix.
Do not change code until I approve.
```
