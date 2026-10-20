# SQLite — AI audit prompts

Paste into Claude Code, Cursor or any agent:

```
Audit how this app uses SQLite in production.
Check: where the database file lives (a disk wiped on deploy, more than one instance, a served
folder), journal mode and busy timeout and their order, write transactions that don't start with
BEGIN IMMEDIATE, schema or seed code inside the connect function, relative paths and code that
creates an empty file when the path is wrong, backups made by copying the file, foreign_keys off,
NOCASE or LIKE used for non-English text, and columns holding mixed types or date formats.
Output a table: severity (P0/P1/P2), file:line, issue, fix.
Do not change code until I approve.
```
