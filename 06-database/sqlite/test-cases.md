# SQLite — pre-launch test cases

- [ ] `SQLITE-010` **P1** 20 parallel writes plus reads against a cold start finish without "database is locked" or "busy" errors
- [ ] `SQLITE-011` **P1** Last night's backup restores into a fresh file, `PRAGMA integrity_check;` returns `ok`, and the app opens it
- [ ] `SQLITE-012` **P2** `PRAGMA journal_mode;` returns `wal` on production, and the database is on a local disk, not a network share
