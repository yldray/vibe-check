# SQLite — tooling

| Purpose | Tool |
|---|---|
| Inspect and query | `sqlite3` CLI, DB Browser for SQLite, `sqlite-utils` |
| Settings | `PRAGMA journal_mode;`, `PRAGMA busy_timeout;`, `PRAGMA foreign_keys;`, `PRAGMA user_version;` |
| Health | `PRAGMA integrity_check;`, `PRAGMA foreign_key_check;` |
| Safe backups | `sqlite3 app.db ".backup out.db"`, `VACUUM INTO 'out.db'`, Litestream for continuous copies to object storage |
| Concurrency test | `hey`, `k6` or `autocannon` against a write endpoint, then grep logs for `locked` / `busy` |
| Types | `SELECT typeof(col), count(*) FROM t GROUP BY 1;`, `STRICT` tables |
