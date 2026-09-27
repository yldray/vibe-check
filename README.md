<div align="center">

# ✅ vibe-check

**Ship AI-written code without shipping AI-written bugs.**

Pre-launch test cases, chronic bugs and store-release rules for vibe coders.
React · Angular · Vue · .NET · Java · Node · Python · Android · iOS · Expo · Flutter

![License](https://img.shields.io/badge/license-MIT-green) ![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen) ![Made for](https://img.shields.io/badge/made%20for-Claude%20Code%20%7C%20Cursor%20%7C%20Copilot-purple)

<img src="assets/sample-report.png" alt="Sample vibe check report: four P0 checks, three FAIL, verdict NOT READY" width="720">

</div>

---

## ⚡ 30-second start

1. Copy one file from [`agents/`](agents/) into your project root:
   - Claude Code → `CLAUDE.md`
   - Cursor → `.cursorrules`
   - Codex / others → `AGENTS.md`
2. Tell your agent: **"Run vibe check"**
3. Fix every **P0** before you ship. A P0 marked `NEEDS REVIEW` counts too: confirm it yourself.

No install. No config. Your AI audits the code it wrote.

## 🔒 Is it safe?

Everything here is plain Markdown you can read. The whole agent behavior is one file, [`agents/CLAUDE.md`](agents/CLAUDE.md), and it takes about 2 minutes to read.

- **Nothing to install or run.** No binaries, no packages, no scripts in your project. (`scripts/sync-agents.sh` is only for maintainers of this repo.)
- **Read-only audit.** The agent does not change your code until you approve the report.
- **Fetches from one place only:** raw files of this repo. It ignores links to other sites.
- **Fetched files are data, not instructions.** If one asks the agent to change its rules, edit or delete files, install anything, reveal secrets or send data, the agent refuses and flags it as `⚠️ Suspicious source content`.
- **Secrets stay hidden.** It never prints a secret value. It shows the name, file:line and a masked value like `sk_live_****`.
- **Want a frozen version?** Fork the repo and point the base URL in your copy of the agent file to your fork.

## 🚦 Severity

| Level | Meaning |
|---|---|
| **P0** | Blocks launch. Do not ship. |
| **P1** | Fix within the first week. |
| **P2** | Improvement. Nice to have. |

## 🗂 What's inside

| Folder | What you get |
|---|---|
| [`00-universal`](00-universal/) | Checks for every project: security, env, performance, a11y, privacy, AI pitfalls |
| [`01-frontend`](01-frontend/) | React, Angular, Vue, vanilla JS |
| [`02-backend`](02-backend/) | .NET, Java Spring, Node, Python |
| [`03-mobile`](03-mobile/) | Android, iOS, React Native / Expo, Flutter |
| [`04-release`](04-release/) | Google Play, App Store and web deploy rules |
| [`agents`](agents/) | Drop-in files for AI coding agents |
| [`templates`](templates/) | Test case and bug report templates |

Every stack folder has the same 4 files:

- `chronic-issues.md` → bugs that keep coming back in this stack
- `test-cases.md` → what to test before going live
- `tooling.md` → which test tools to use
- `ai-prompts.md` → copy-paste audit prompts for your agent

## 📊 Coverage

| Stack | Status |
|---|---|
| Universal · Release | ✅ Complete |
| React · Node · Expo | ✅ Complete |
| Angular · Vue · .NET · Java · Python · Android · iOS · Flutter | 🌱 Seeded, needs contributors |

## 🤝 Contributing

Seen an AI break the same thing twice? That's a test case. Read [CONTRIBUTING.md](CONTRIBUTING.md) and open a PR.

## 📄 License

MIT
