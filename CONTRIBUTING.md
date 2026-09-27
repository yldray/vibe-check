# Contributing

Thanks for helping vibe coders ship safer code.

## What we accept

- A **chronic issue**: a bug you've seen AI tools produce more than once
- A **test case**: a concrete check someone can run before launch
- A **fix** to an outdated rule (store policies change often)

## Rules

1. Use the format in [`templates/test-case-template.md`](templates/test-case-template.md).
2. IDs follow `STACK-NNN` (e.g. `REACT-014`). Take the next free number. A stack's `chronic-issues.md` and `test-cases.md` share one sequence. Files without a stack have their own prefix (`SEC-`, `ENV-`, `FE-`, `WEB-`, …).
3. Every item must be **testable**. "Write clean code" is not a test case.
4. Pick a severity honestly. P0 means "this breaks production or gets you rejected".
5. Store and legal rules: link the official source.
6. Agent files: edit only `agents/CLAUDE.md`, then run `sh scripts/sync-agents.sh`. CI rejects PRs where the copies differ.
   Added or changed a P0? Run `python3 scripts/build-quick.py` to rebuild `quick/p0.md`, and add it to `quick/manual.txt` if it needs a device, a store console or production. CI checks both.
7. **Describe the pattern, not the project.** This repo is public. In issues, PRs, commits and test cases, never include names, URLs, file paths, issue numbers, report excerpts or secrets from private or client projects, even masked. "A Next.js app that puts a private key in `NEXT_PUBLIC_`" is fine; the app's name is not.

## Adding a new stack

1. Copy any existing stack folder and keep the same 4 files. Pick a new prefix (e.g. `GO-`) and start at `001`.
2. In `agents/CLAUDE.md`, add a row to the stack table in Step 3 (and the file that reveals the stack to Step 1 if it's new). Then run `sh scripts/sync-agents.sh`.
3. Add the stack to the Coverage table in `README.md` as 🌱 Seeded.
4. Add the folder to `SECTIONS` in `scripts/build-quick.py`, then run `python3 scripts/build-quick.py`.
