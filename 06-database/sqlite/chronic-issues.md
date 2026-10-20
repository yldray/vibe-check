# SQLite — chronic issues

For apps that use a SQLite file from a server, worker or function (`sqlite3`, `better-sqlite3`, `Microsoft.Data.Sqlite`, Prisma or Drizzle with the SQLite provider). On-device databases in mobile apps are covered by the mobile stacks.

### SQLITE-001 · The database file lives on a disk that is wiped on every deploy
**Severity:** P0
**Why it breaks:** SQLite works on the laptop, so AI ships it to a host whose filesystem is temporary: serverless functions, a container without a volume, a free web service tier, a platform that rebuilds the machine on deploy. Every deploy, restart or scale-out starts from the file baked into the image or from an empty one, and sign-ups, orders and uploads written since are gone. With two instances, each writes its own copy.
**How to test:** Find the database path in config and code, then check on the host whether it sits on a persistent volume. Create a record in staging, redeploy and restart, and look for it. Check the instance count and autoscaling settings.
**Pass:** The record survives deploys and restarts; exactly one instance writes the file, or the app uses a server database.
**Fix:** Mount a persistent volume at the database path and pin the app to one instance; or move to a server database (or a hosted SQLite service built for this); stream backups off the host (`SQLITE-005`).

### SQLITE-002 · "database is locked" as soon as two users write
**Severity:** P1
**Why it breaks:** AI keeps SQLite's defaults. In the default rollback-journal mode one writer blocks every reader, and requests fail with "database is locked" once the busy timeout runs out (0 in the SQLite C API, 5 seconds in Python's `sqlite3`). `PRAGMA journal_mode=WAL` placed before the busy timeout fails under load itself, and a "fallback" to `DELETE` mode locks everyone out again. Even in WAL mode, a transaction that reads first and writes later fails at once with `SQLITE_BUSY` when another connection wrote in between, because the busy timeout doesn't apply to that upgrade.
**How to test:** Read the connection setup: the order of `busy_timeout` and `journal_mode`, and how write transactions start. Run 20 parallel writes plus reads against a cold start and grep the logs for "locked" and "busy".
**Pass:** No "locked" or "busy" errors at the expected concurrency.
**Fix:** Set the busy timeout first, then WAL (once; it is stored in the file), and keep the current mode if switching fails; start transactions that will write with `BEGIN IMMEDIATE`; keep write transactions short; WAL needs a local disk, never a network share.

### SQLITE-003 · Schema setup on every connection
**Severity:** P1
**Why it breaks:** AI puts `CREATE TABLE IF NOT EXISTS`, `PRAGMA table_info` followed by `ALTER TABLE … ADD COLUMN`, or a seed inside the function that opens the connection. Two requests open connections at the same moment after a deploy, both see the column missing, and one fails with "duplicate column name" or "table already exists". The same race corrupts seeds (two default admins, duplicate settings rows).
**How to test:** Grep the connect function for `CREATE`, `ALTER`, `table_info` and inserts. Start the app and send 20 requests at once to a fresh database file.
**Pass:** Schema changes and seeds run once, from a deploy or startup step that holds a lock, and never from the per-connection code.
**Fix:** Migrations as a deploy step (or one startup step guarded by a lock), with `PRAGMA user_version` or a migrations table. See `OPS-001`.

### SQLITE-004 · A wrong path silently creates an empty database
**Severity:** P1
**Why it breaks:** Opening a SQLite path that doesn't exist creates a new empty file. A relative path that resolves against another working directory (a service manager, a scheduled task, a different deploy folder), a typo in an env var or a renamed folder makes the app run against an empty database. With schema auto-create it even looks healthy: logins fail, lists are empty, and new data goes into the wrong file.
**How to test:** Start the production build with the database path pointing to a missing file, and once from another working directory. Grep for relative database paths.
**Pass:** Startup stops with an error that names the path; the path is absolute or resolved from the app folder.
**Fix:** Outside the setup step, open in "must exist" mode (`file:/path/app.db?mode=rw` with URI filenames, `Mode=ReadWrite` in `Microsoft.Data.Sqlite`) or check that the file exists first; log the resolved absolute path at startup. See `ENV-005`.

### SQLITE-005 · Backups made by copying the file
**Severity:** P1
**Why it breaks:** AI backs up with `cp app.db backup/` or a file-level snapshot. In WAL mode the latest commits live in `app.db-wal`, so the copy is missing them; a copy taken during a write can be unreadable. Nobody opens a backup until the day it is needed.
**How to test:** Read the backup job. Restore last night's backup into a fresh file, run `PRAGMA integrity_check;`, and open the app on it.
**Pass:** The restored copy passes the integrity check and has yesterday's data.
**Fix:** `sqlite3 app.db ".backup /backups/app-$(date +%F).db"` or `VACUUM INTO`, or continuous replication to object storage (Litestream); keep copies off the host and test a restore. See `WEB-003`.

### SQLITE-006 · Foreign keys that are never enforced
**Severity:** P1
**Why it breaks:** SQLite ignores `REFERENCES` and `ON DELETE CASCADE` unless each connection runs `PRAGMA foreign_keys = ON`, and many drivers don't do it for you. Deleting a user leaves orphan rows, cascades never happen, and rows point at IDs that don't exist.
**How to test:** From the app's own connection, run `PRAGMA foreign_keys;` (1 means on). On a production copy, run `PRAGMA foreign_key_check;`.
**Pass:** It returns 1 on every connection, and `foreign_key_check` returns no rows.
**Fix:** Turn it on in the connection setup (or the driver's option) and clean existing orphans in a migration.

### SQLITE-007 · Case-insensitive search that only knows English letters
**Severity:** P2
**Why it breaks:** `COLLATE NOCASE`, `LIKE` and `lower()` fold only ASCII letters. Searches, logins and unique checks on names and e-mails miss `İ/i`, `Ü/ü`, `É/é`, so "Ömer" isn't found by "ömer" and two accounts can differ only by case.
**How to test:** Seed names with non-English letters and search them in lower case and upper case; try to register the same e-mail with a non-ASCII letter in another case.
**Pass:** Every variant finds the record, and the duplicate is refused.
**Fix:** Store a normalized key column (lowercased with a Unicode-aware function in the app, accents removed if the product wants that) with a unique index, and search on it. See `QA-012`.

### SQLITE-008 · Columns that accept any type
**Severity:** P2
**Why it breaks:** A column declared `INTEGER` or `DATETIME` accepts text. AI stores dates in several formats (`2026-10-20`, `20.10.2026`, a Unix timestamp) and IDs as both `1` and `"1"`, so sorting, date ranges and unique checks quietly give wrong results.
**How to test:** On a production copy, run `SELECT typeof(col), count(*) FROM t GROUP BY 1;` for date, amount and ID columns.
**Pass:** One storage type per column, and dates in one format.
**Fix:** `STRICT` tables (SQLite 3.37+) or `CHECK` constraints; dates as ISO 8601 UTC text or epoch numbers only; clean old rows in a migration.

### SQLITE-009 · The database file can be downloaded
**Severity:** P0
**Why it breaks:** The `.db` file sits in a folder the web server serves (`public/`, `static/`, `wwwroot/`, the project root on a shared host), or a backup copy does. Anyone who guesses `/app.db`, `/database.sqlite` or `/db.sqlite3` downloads every user, password hash and order.
**How to test:** List where the database file, its `-wal` and `-shm` files and backups live, and compare with the static roots. Request `/app.db`, `/database.sqlite`, `/db.sqlite3`, `/data.db` and the real file name on production.
**Pass:** Every request returns 404 or 403, and the files live outside every served folder.
**Fix:** Move the database and backups outside the web root and block `*.db`, `*.sqlite*` and `*-wal` / `*-shm` in the server config. See `WEB-015`.
