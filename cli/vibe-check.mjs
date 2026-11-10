#!/usr/bin/env node
// npx vibe-check <command>
//
//   install [--agent=claude|codex|cursor] [--force]
//       Puts the agent file in the current project so your coding agent knows
//       what "Run vibe check" means. Nothing else is added to the project.
//   scan [dir] [--json] [--github] [--no-fail]
//       Deterministic checks only (no LLM): secrets, .env in git, client-bundled
//       keys, open CORS, GitHub Actions injection.

import { copyFileSync, existsSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const [cmd, ...rest] = process.argv.slice(2)

const FILES = {
  claude: { from: 'agents/CLAUDE.md', to: 'CLAUDE.md' },
  codex: { from: 'agents/AGENTS.md', to: 'AGENTS.md' },
  cursor: { from: 'agents/.cursorrules', to: '.cursorrules' },
}

function guessAgent() {
  const here = readdirSync('.')
  if (here.includes('.cursor') || here.includes('.cursorrules')) return 'cursor'
  if (here.includes('.claude') || here.includes('CLAUDE.md')) return 'claude'
  return 'codex' // AGENTS.md is read by Codex, Copilot, Gemini CLI and most others
}

function install(args) {
  const agent = (args.find((a) => a.startsWith('--agent='))?.split('=')[1] ?? guessAgent()).toLowerCase()
  const file = FILES[agent]
  if (!file) {
    console.error(`Unknown agent "${agent}". Use --agent=claude, --agent=codex or --agent=cursor.`)
    process.exit(2)
  }
  if (existsSync(file.to) && !args.includes('--force')) {
    console.error(`${file.to} already exists. vibe-check won't overwrite it.`)
    console.error(`Append the rules yourself from https://github.com/yldray/vibe-check/blob/main/${file.from}, or rerun with --force.`)
    process.exit(1)
  }
  copyFileSync(join(root, file.from), file.to)
  console.log(`✓ Added ${file.to}`)
  if (agent === 'claude') {
    console.log('\nTip: in Claude Code the plugin keeps the checks bundled and up to date. Type in the chat:')
    console.log('  /plugin marketplace add yldray/vibe-check')
    console.log('  /plugin install vibe-check@vibe-check')
  }
  console.log('\nNow tell your agent: "Run vibe check" (or "quick vibe check" for P0s only).')
}

switch (cmd) {
  case 'install':
    install(rest)
    break
  case 'scan':
    process.argv = [process.argv[0], join(root, 'cli/scan.mjs'), ...rest]
    await import('./scan.mjs')
    break
  default:
    console.log(`vibe-check: pre-launch audit for AI-written code

  npx vibe-check install [--agent=claude|codex|cursor] [--force]
      Add the agent file, then tell your agent "Run vibe check".
  npx vibe-check scan [dir] [--json] [--github] [--no-fail]
      Deterministic checks only, no LLM (good for CI).

https://github.com/yldray/vibe-check`)
    process.exit(cmd ? 2 : 0)
}
