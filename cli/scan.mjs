#!/usr/bin/env node
// vibe-check scan: the deterministic part of the audit. No LLM, no network,
// no dependencies (Node 18+ and git). It runs a few P0 checks that a pattern
// can decide, so they can gate CI. The full audit is still "Run vibe check"
// in your coding agent.
//
//   node cli/scan.mjs [dir] [--json] [--github] [--no-fail]
//
// It never prints a secret value: only file names, check IDs and counts.

import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const args = process.argv.slice(2)
const flag = (name) => args.includes(name)
const dir = resolve(args.find((a) => !a.startsWith('--')) ?? '.')

const git = (...a) => {
  try {
    return execFileSync('git', ['-C', dir, ...a], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] })
  } catch (e) {
    // git grep exits 1 when nothing matches
    if (e.status === 1) return ''
    throw e
  }
}

try {
  git('rev-parse', '--is-inside-work-tree')
} catch {
  console.error(`vibe-check scan: ${dir} is not a git repository.`)
  process.exit(2)
}

const findings = []
const add = (id, severity, status, file, check, fix) => findings.push({ id, severity, status, file, check, fix })

// Files that describe these patterns (agent files, this scanner) are skipped.
const SKIP = [
  ':(exclude,glob)**/CLAUDE.md',
  ':(exclude,glob)**/AGENTS.md',
  ':(exclude,glob)**/.cursorrules',
  ':(exclude,glob)**/skills/vibe-check/**',
  ':(exclude,glob)**/cli/scan.mjs',
]

/* ---------- SEC-001 · secrets in tracked files ---------- */
// Same patterns as the agent's Quick mode: a literal value assigned to a
// secret-like name, or a known key format.
const A = `[a-z0-9_]*(key|secret|token|passw(or)?d|pwd|salt)[a-z0-9_]*["']?[[:space:]]*[:=,][[:space:]]*["'](\\\\")?[^"'<>\${}[:space:]\\\\]{8,}`
const B = `(^|[;[:space:]])(password|pwd)=[^;"'<>\${}[:space:]]{6,}|^[a-z0-9_]*(key|secret|token|password)[a-z0-9_]*=[^[:space:]$<{]{8,}`
const C = '(sk_live_|sk-proj-[A-Za-z0-9_-]{20}|sk-ant-[A-Za-z0-9_-]{20}|sb_secret_|AIza[0-9A-Za-z_-]{20}|AKIA[0-9A-Z]{16}|ghp_[0-9A-Za-z]{20}|xox[bp]-[0-9A-Za-z-]{10}|-----BEGIN [A-Z ]*PRIVATE KEY)'

const counts = (out) =>
  out
    .split('\n')
    .filter(Boolean)
    .map((l) => {
      const i = l.lastIndexOf(':')
      return { file: l.slice(0, i), n: Number(l.slice(i + 1)) }
    })

const known = counts(git('grep', '-cE', '-e', C, '--', '.', ...SKIP))
const assigned = counts(git('grep', '-ciE', '-e', A, '-e', B, '--', '.', ...SKIP))

const isExample = (f) => /(^|\/)(test|tests|__tests__|spec|fixtures?|examples?|mocks?)\/|\.(test|spec)\.|\.example(\.|$)|\.sample(\.|$)|\.md$/i.test(f)
const isDevOnly = (f) => /\.(development|local)\.|(^|\/)docker-compose/i.test(f)
const isMigration = (f) => /(^|\/)migrations?\//i.test(f)
const isConfig = (f) => /(^|\/)(\.env[^/]*|appsettings[^/]*\.json|config\.(js|ts|py)|settings\.py|application\.(ya?ml|properties))$/i.test(f)

for (const { file } of known) {
  if (isExample(file)) add('SEC-001', 'P0', 'NEEDS REVIEW', file, 'Known key format in a test, example or doc', 'Confirm it is a fake value; if real, rotate it and purge history.')
  else add('SEC-001', 'P0', 'FAIL', file, 'Known key format (live key, token or private key)', 'Rotate the key now, move it to a secret store, purge it from history.')
}
const knownFiles = new Set(known.map((k) => k.file))
for (const { file, n } of assigned) {
  if (knownFiles.has(file)) continue
  if (isMigration(file)) continue // EF/ORM snapshots: `HasKey(...)`, column names
  if (isConfig(file) && !isDevOnly(file) && !isExample(file))
    add('SEC-001', 'P0', 'FAIL', file, `Settings file assigns a literal to ${n} secret-like name(s)`, 'Move the values to environment variables or a secret store.')
  else if (isDevOnly(file))
    add('SEC-001', 'P0', 'NEEDS REVIEW', file, 'Dev-only file assigns literals to secret-like names', 'Fine for a local database; make sure production never reads it.')
}

/* ---------- ENV-001 · .env files in git ---------- */
const tracked = git('ls-files').split('\n').filter(Boolean)
for (const f of tracked) {
  const base = f.split('/').pop()
  if (/^\.env(\..+)?$/.test(base) && !/\.(example|sample|template|dist)$/.test(base))
    add('ENV-001', 'P0', 'FAIL', f, '.env file committed to git', 'Remove it from git (git rm --cached), add it to .gitignore, rotate its values.')
}
const gi = join(dir, '.gitignore')
if (tracked.length && (!existsSync(gi) || !/^\s*\.env/m.test(readFileSync(gi, 'utf8'))))
  add('ENV-001', 'P0', 'FAIL', '.gitignore', '.env is not in .gitignore', 'Add `.env` and `.env.*` (keep `!.env.example`).')

/* ---------- FE-001 · secret-like names shipped to the client ---------- */
const PUBLIC_PREFIX = '(NEXT_PUBLIC_|EXPO_PUBLIC_|VITE_|REACT_APP_|NUXT_PUBLIC_|PUBLIC_)'
const pub = git('grep', '-noE', `${PUBLIC_PREFIX}[A-Z0-9_]*(SECRET|PRIVATE|PASSWORD|SERVICE_ROLE|API_KEY|TOKEN)[A-Z0-9_]*`, '--', '.', ...SKIP)
const seenPub = new Set()
for (const line of pub.split('\n').filter(Boolean)) {
  const [file, ln, name] = line.split(':')
  if (seenPub.has(file + name)) continue
  seenPub.add(file + name)
  // Publishable and anon keys are meant to be public.
  if (/PUBLISHABLE|ANON/.test(name)) continue
  add('FE-001', 'P0', 'FAIL', `${file}:${ln}`, `${name} is bundled into the client`, 'Anything with a public prefix ships to every user; call it from the server instead.')
}

/* ---------- SEC-005 · CORS open to any origin with credentials ---------- */
const cors = git('grep', '-lE', `AllowAnyOrigin\\(\\)|Access-Control-Allow-Origin["']?[[:space:]]*[:,][[:space:]]*["']\\*|origin:[[:space:]]*["']\\*["']|allow_origins=\\[["']\\*["']\\]|CORS_ALLOW_ALL_ORIGINS[[:space:]]*=[[:space:]]*True`, '--', '.', ...SKIP)
for (const file of cors.split('\n').filter(Boolean)) {
  if (isExample(file)) continue
  add('SEC-005', 'P0', 'NEEDS REVIEW', file, 'CORS allows any origin', 'On an authenticated API, list the allowed origins instead of `*`.')
}

/* ---------- OPS-010 / OPS-011 · GitHub Actions injection ---------- */
const wf = tracked.filter((f) => /^\.github\/workflows\/[^/]+\.ya?ml$/.test(f))
for (const f of wf) {
  const text = readFileSync(join(dir, f), 'utf8')
  const lines = text.split('\n')
  if (/^\s*pull_request_target\s*:/m.test(text) && /github\.event\.pull_request\.head\.(sha|ref)|github\.head_ref/.test(text))
    add('OPS-010', 'P0', 'FAIL', f, 'pull_request_target checks out the PR code', 'Use pull_request, or never run PR code in a pull_request_target job.')
  // ${{ github.event.* }} / head_ref inside a run: block
  let inRun = false
  let runIndent = 0
  lines.forEach((l, i) => {
    const m = l.match(/^(\s*)(-\s+)?run:\s*(.*)$/)
    if (m) {
      inRun = true
      runIndent = m[1].length + (m[2] ? m[2].length : 0)
      if (/\$\{\{\s*(github\.event\.|github\.head_ref)/.test(m[3]))
        add('OPS-011', 'P0', 'FAIL', `${f}:${i + 1}`, 'Event data expanded straight into run:', 'Pass it through env: and quote the variable ("$VAR").')
      return
    }
    if (inRun) {
      const indent = l.match(/^(\s*)/)[1].length
      if (l.trim() && indent <= runIndent) inRun = false
      else if (/\$\{\{\s*(github\.event\.|github\.head_ref)/.test(l))
        add('OPS-011', 'P0', 'FAIL', `${f}:${i + 1}`, 'Event data expanded straight into run:', 'Pass it through env: and quote the variable ("$VAR").')
    }
  })
}

/* ---------- report ---------- */
const order = { FAIL: 0, 'NEEDS REVIEW': 1 }
findings.sort((a, b) => order[a.status] - order[b.status] || a.id.localeCompare(b.id))
const fails = findings.filter((f) => f.status === 'FAIL').length
const reviews = findings.length - fails

if (flag('--json')) {
  console.log(JSON.stringify({ findings, fail: fails, needsReview: reviews }, null, 2))
} else {
  console.log('VIBE CHECK SCAN (deterministic checks only)')
  console.log(`Checked: ${tracked.length} tracked files · SEC-001 ENV-001 FE-001 SEC-005 OPS-010 OPS-011\n`)
  if (!findings.length) console.log('No findings.')
  for (const f of findings) console.log(`${f.status.padEnd(12)} ${f.id.padEnd(8)} ${f.file}\n${' '.repeat(22)}${f.check} → ${f.fix}`)
  console.log(`\nFAIL: ${fails} · NEEDS REVIEW: ${reviews}`)
  console.log('The full audit (auth, payments, store rules, each stack’s chronic bugs): tell your agent "Run vibe check".')
}

if (flag('--github')) {
  for (const f of findings) {
    const [file, line] = f.file.split(':')
    const level = f.status === 'FAIL' ? 'error' : 'warning'
    console.log(`::${level} file=${file}${line ? `,line=${line}` : ''},title=${f.id}::${f.check}. ${f.fix}`)
  }
}

process.exit(fails && !flag('--no-fail') ? 1 : 0)
