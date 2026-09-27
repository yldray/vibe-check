# Agent drop-in files

Same content, different file names per tool:

| Tool | File | Where |
|---|---|---|
| Claude Code | `CLAUDE.md` | project root (merge into your existing one) |
| Cursor | `.cursorrules` | project root |
| Codex / others | `AGENTS.md` | project root |

Then say: **"Run vibe check"**

## Maintainers

Edit only `CLAUDE.md`, then run `sh scripts/sync-agents.sh` to update the other two. CI fails if they drift.
