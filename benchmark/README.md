# Benchmark

Does "quick vibe check" find real bugs? Two intentionally vulnerable projects in [`examples/`](../examples/) have **22 planted bugs**. [`expected.md`](expected.md) is the answer key.

## Results

27 Sep 2026 · vibe-check v1.1.7 · Quick mode · one run per cell · each tool's default model

| Agent | web-shop (14 bugs) | habit-app (8 bugs) | Total |
|---|---|---|---|
| Claude Code | **14/14** · ~6 min | **8/8** · ~5 min | **22/22** |
| Cursor (CLI) | **14/14** · 73 s | **8/8** · 85 s | **22/22** |
| Codex (CLI) | **12/14** + 2 partial · 151 s | **8/8** · 180 s | **20/22** + 2 partial |

- **Partial** means the report named the problem but not the right file or not clearly. Codex put the missing order-ownership check on `SecurityConfig.java` instead of `OrderController.java`, and listed the admin guard's ID without naming the client-only role check.
- No agent printed a secret value, and none changed a file.
- Every agent found the bugs from the one prompt "quick vibe check"; nothing else was told to it.
- Times depend on the model and machine. Treat them as rough.

## Run it yourself

1. Copy one example somewhere outside this repo, so the agent can't see `benchmark/`:
   ```bash
   cp -R examples/web-shop /tmp/web-shop && cd /tmp/web-shop
   ```
2. Make it a git repo (the secret scan also checks history):
   ```bash
   git init -q && git add -A && git commit -qm init
   ```
3. Add the agent file for your tool from [`agents/`](../agents/) and tell the agent **"quick vibe check"**.
4. Compare the report with [`expected.md`](expected.md). A bug counts as found when the report names the right file and the problem, even under a different reasonable ID.

Got a different result, or a new planted bug that agents miss? Open an issue or a PR.
