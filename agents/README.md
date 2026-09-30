# Agent drop-in files

Same content, different file names per tool:

| Tool | File | Where |
|---|---|---|
| Claude Code | `CLAUDE.md` | project root (merge into your existing one) |
| Cursor | `.cursorrules` | project root |
| Codex / others | `AGENTS.md` | project root |
| Claude Code (plugin) | [`skills/vibe-check/SKILL.md`](../skills/vibe-check/SKILL.md) | `/plugin marketplace add yldray/vibe-check` |

Then say: **"Run vibe check"**

## Maintainers

Edit only `CLAUDE.md`, then run `sh scripts/sync-agents.sh` to update the other two and the plugin skill. CI fails if they drift.
