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

## Adding a new stack

Copy any existing stack folder and keep the same 4 files.
