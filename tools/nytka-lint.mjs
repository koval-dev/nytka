#!/usr/bin/env node
// ---------------------------------------------------------------------------------------
// GENERATED FILE — DO NOT EDIT.
//
// Source:      @nytka/cli/src/lint.mjs
// Regenerate:  npm run vendor  (in the kd-nytka repo, packages/cli)
//
// Committed here on purpose: this repo must be runnable with nothing installed, so the
// tools everyone is asked to run cannot require an npm install first. It is a read-only
// view of a source that lives elsewhere, which is what SPEC P2 permits — one writable
// definition of conformance, synced in one direction.
//
// Editing this file makes the two disagree, and a test in the source repo will fail.
// Install the package instead if you want it as a dependency:  npm i -D @nytka/cli
// ---------------------------------------------------------------------------------------
// nytka-lint — health check for a nytka project package.
// Zero dependencies. Usage: node nytka-lint.mjs [dir] [--json] [--today YYYY-MM-DD]
//
// Parses only the nytka frontmatter subset (SPEC.md §5): scalars, inline {a: b} maps,
// inline [a, b] lists, and "- " list items including inline maps. That is deliberate —
// a full YAML parser would be a dependency, and the vocabulary is small on purpose.
//
// ---------------------------------------------------------------------------------------
// This file is BOTH a library and a script, and that is the whole trick behind
// decisions/0009: `@nytka/cli` imports it, and `../nytka/tools/nytka-lint.mjs` is a copy of
// it with a generated header. Because the copy is byte-identical below that header, "the two
// have not drifted" is a string comparison rather than a promise.
//
// Two rules follow, and breaking either silently breaks the vendored copy:
//   1. Import nothing but `node:` builtins and vendored siblings by relative path. Not
//      @nytka/core — the copy has no node_modules to resolve from and must run under bare node
//      in a repo with no install. 0010 widened this from "node: only" when the parser became
//      shared: a relative import resolves against the file rather than node_modules, so it
//      costs nothing, but only while the sibling is itself vendored. A test checks that.
//   2. Keep every export pure. `main()` is the only thing allowed to read argv, print, or
//      exit, and it runs only when this file is executed directly.

import { readFileSync, readdirSync, statSync, existsSync, realpathSync } from 'node:fs'
import { join, relative, extname, basename, dirname, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const SKIP_DIRS = new Set(['.git', 'node_modules', 'private', '.claude', 'templates'])
// Files exempt from the frontmatter requirement (SPEC.md §13).
const EXEMPT = new Set(['README.md', 'CLAUDE.md', 'AGENTS.md', 'LICENSE.md', 'CHANGELOG.md'])
const VALID_STATUS = new Set(['draft', 'stable', 'deprecated', 'superseded'])
const VALID_CONFIDENCE = new Set(['stated', 'inferred', 'ambiguous'])
// current-state.md is considered stale after this many days without an update.
const CURRENT_STATE_MAX_AGE_DAYS = 30
// Raw HTML a markdown document may legitimately contain, so C11 does not read it as a blank.
const HTML_TAGS = new Set([
  'br', 'hr', 'b', 'i', 'em', 'strong', 'code', 'pre', 'div', 'span', 'p', 'a', 'img',
  'ul', 'ol', 'li', 'table', 'thead', 'tbody', 'tr', 'td', 'th', 'details', 'summary',
  'sup', 'sub', 'kbd', 'blockquote', 'figure', 'figcaption', 'small', 'mark', 'picture',
])

/**
 * Local calendar date. Not `toISOString().slice(0, 10)` — that converts to UTC first, so
 * anywhere west of Greenwich an evening run stamps tomorrow's date.
 */
export function isoDate (d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Thrown when the target directory does not exist. Carries the exit code the CLI uses. */
export class LintUsageError extends Error {
  constructor (message) { super(message); this.name = 'LintUsageError'; this.exitCode = 2 }
}

// ---------------------------------------------------------------- frontmatter

// The parser lives in yaml.mjs and is shared with the task commands. It used to live here,
// in a second subset that disagreed with the other one — see 0010.
export { parseFrontmatter } from './nytka-yaml.mjs'
import { parseFrontmatter } from './nytka-yaml.mjs'

// ---------------------------------------------------------------- walk

function walk (dir, acc = []) {
  let entries
  try { entries = readdirSync(dir) } catch { return acc }
  for (const name of entries) {
    if (SKIP_DIRS.has(name)) continue
    const full = join(dir, name)
    let st
    try { st = statSync(full) } catch { continue }
    if (st.isDirectory()) walk(full, acc)
    else acc.push(full)
  }
  return acc
}

// ---------------------------------------------------------------- checks

/**
 * Lint a nytka project directory. Pure: reads the filesystem, writes nothing, prints
 * nothing, never exits. Returns every finding so the caller decides what to do with them.
 *
 * @param {string} dir  project root
 * @param {{today?: string}} opts  `today` overrides the clock, for tests and for --today=
 * @returns {{root: string, today: string, counts: object, findings: Array, documents: number}}
 */
export function lintProject (dir = '.', { today = isoDate() } = {}) {
  const root = resolve(dir)
  const TODAY = today

  const findings = []
  const add = (level, check, file, message) => findings.push({ level, check, file, message })

  if (!existsSync(root)) throw new LintUsageError(`no such directory: ${root}`)

  const files = walk(root)
  const mdFiles = files.filter(f => extname(f) === '.md')
  const relOf = f => relative(root, f)
  const allRelFiles = new Set(files.map(relOf))

  // C1 — required files
  for (const req of ['project.yaml', 'AGENTS.md']) {
    if (!existsSync(join(root, req))) {
      add('error', 'required-file', req, `missing — required by SPEC.md §13`)
    }
  }

  const docs = new Map()   // relpath -> { fm, text }
  const linkTargets = new Map()

  for (const file of mdFiles) {
    const rel = relOf(file)
    const text = readFileSync(file, 'utf8')
    const fm = parseFrontmatter(text)
    docs.set(rel, { fm, text })

    const isExempt = EXEMPT.has(basename(file))

    // C2 — frontmatter present with non-empty type
    if (!fm) {
      if (!isExempt) add('warn', 'missing-frontmatter', rel, 'no YAML frontmatter')
    } else {
      if (!fm.type && !isExempt) {
        add('error', 'missing-type', rel, '`type` is required and must be non-empty')
      }
      // C3 — enum sanity (warn only: SPEC.md §13 forbids rejecting on unknown values)
      if (fm.status && !VALID_STATUS.has(String(fm.status))) {
        add('warn', 'unknown-status', rel, `status "${fm.status}" not in ${[...VALID_STATUS].join(' | ')}`)
      }
      if (fm.confidence && !VALID_CONFIDENCE.has(String(fm.confidence))) {
        add('warn', 'unknown-confidence', rel, `confidence "${fm.confidence}" not in ${[...VALID_CONFIDENCE].join(' | ')}`)
      }
      // C4 — expiry
      for (const key of ['stale_after', 'validUntil']) {
        const val = fm[key]
        if (val && val !== null && String(val) < TODAY) {
          add('error', 'stale', rel, `${key} ${val} has passed (today ${TODAY}) — re-verify before use`)
        }
      }
      // C5 — trust tier
      const verified = Array.isArray(fm.verified) ? fm.verified : (fm.verified ? [fm.verified] : [])
      const humanVerified = verified.some(v => v && typeof v === 'object' && String(v.by || '').startsWith('human:'))
      const describesExternal = fm.confidence === 'stated' || Boolean(fm.sources)
      if (describesExternal && verified.length === 0) {
        add('warn', 'unverified', rel, 'claims a stated fact or cites sources but has no `verified` entry')
      }
      if (fm.type === 'Decision' && !humanVerified && fm.status === 'stable') {
        add('warn', 'decision-unconfirmed', rel, 'stable Decision with no human: verifier — is this actually agreed?')
      }
    }

    // collect relative markdown link targets
    for (const m of text.matchAll(/\[[^\]]*\]\(([^)#\s]+)(?:#[^)]*)?\)/g)) {
      const target = m[1]
      if (/^(https?:|mailto:|#)/.test(target)) continue
      const resolved = relative(root, resolve(dirname(file), target))
      if (!linkTargets.has(resolved)) linkTargets.set(resolved, [])
      linkTargets.get(resolved).push(rel)
    }
  }

  // C6 — dangling relative links
  for (const [target, sources] of linkTargets) {
    if (target.startsWith('..')) continue          // outside the package; not ours to check
    const hit = allRelFiles.has(target) ||
                allRelFiles.has(target.replace(/\/$/, '')) ||
                existsSync(join(root, target))
    if (!hit) {
      for (const src of new Set(sources)) {
        add('warn', 'dangling-link', src, `link target does not exist: ${target}`)
      }
    }
  }

  // C7 — decision graph consistency
  const decisions = new Map()
  for (const [rel, { fm }] of docs) {
    if (!rel.startsWith('decisions/') || !fm) continue
    const num = basename(rel).match(/^(\d{4})/)?.[1]
    if (num) decisions.set(num, { rel, fm })
  }
  const pad = n => String(n).padStart(4, '0')
  for (const [num, { rel, fm }] of decisions) {
    const supersedes = fm.supersedes != null && fm.supersedes !== '' ? pad(fm.supersedes) : null
    const supersededBy = fm.superseded_by != null && fm.superseded_by !== '' ? pad(fm.superseded_by) : null

    if (supersedes) {
      const old = decisions.get(supersedes)
      if (!old) {
        add('error', 'decision-graph', rel, `supersedes ${supersedes}, which does not exist`)
      } else {
        if (old.fm.status !== 'superseded') {
          add('error', 'decision-graph', old.rel, `superseded by ${num} but status is "${old.fm.status ?? 'unset'}"`)
        }
        const back = old.fm.superseded_by != null ? pad(old.fm.superseded_by) : null
        if (back !== num) {
          add('error', 'decision-graph', old.rel, `should carry superseded_by: ${num}`)
        }
      }
    }
    if (fm.status === 'superseded' && !supersededBy) {
      add('error', 'decision-graph', rel, 'status is superseded but superseded_by is not set')
    }
    if (supersededBy && !decisions.has(supersededBy)) {
      add('error', 'decision-graph', rel, `superseded_by ${supersededBy}, which does not exist`)
    }
  }

  // C8 — current-state freshness
  const csPath = join(root, 'current-state.md')
  if (existsSync(csPath)) {
    const text = readFileSync(csPath, 'utf8')
    const dates = [...text.matchAll(/\b(20\d{2}-\d{2}-\d{2})\b/g)].map(m => m[1]).sort()
    const newest = dates[dates.length - 1]
    if (!newest) {
      add('warn', 'current-state', 'current-state.md', 'contains no date — cannot tell if it is current')
    } else {
      const ageDays = Math.floor((Date.parse(TODAY) - Date.parse(newest)) / 86400000)
      if (ageDays > CURRENT_STATE_MAX_AGE_DAYS) {
        add('warn', 'current-state', 'current-state.md', `newest date is ${newest} (${ageDays} days old) — likely no longer current`)
      }
    }
  }

  // C9 — datasets registry sanity
  const dsPath = join(root, 'datasets/index.json')
  if (existsSync(dsPath)) {
    try {
      const idx = JSON.parse(readFileSync(dsPath, 'utf8'))
      for (const d of idx.datasets ?? []) {
        if (!d.collectedAt) add('warn', 'dataset', 'datasets/index.json', `${d.id}: missing collectedAt`)
        if (d.validUntil && d.validUntil < TODAY && d.status === 'current') {
          add('error', 'dataset', 'datasets/index.json', `${d.id}: validUntil ${d.validUntil} passed but status is still "current"`)
        }
      }
    } catch (e) {
      add('error', 'dataset', 'datasets/index.json', `unparseable: ${e.message}`)
    }
  }

  // C10 — orphans (nothing links to it)
  const linkedTo = new Set([...linkTargets.keys()])
  for (const rel of docs.keys()) {
    if (EXEMPT.has(basename(rel))) continue
    if (!rel.includes('/')) continue                       // top-level docs are entry points
    if (basename(rel) === 'README.md') continue
    if (!linkedTo.has(rel)) {
      add('info', 'orphan', rel, 'no other document links to it')
    }
  }

  // C11 — template residue: a file that was scaffolded and never filled in.
  //
  // Scoped deliberately. The template documents its own formats with angle brackets —
  // `<PREFIX>-<nnn>`, `{ by: <model>, at: <date> }` — and those lines are meant to survive
  // forever. Every one of them sits inside a code span or a fence, because that is what
  // documenting a format looks like; every genuine blank sits in prose. Strip code first and
  // the two stop being the same string. A check that flagged both would be muted within a
  // week, and a muted check is worse than no check — it still reads as coverage.
  //
  // Both findings read the same stripped `prose`. `template-comment` used to test the raw
  // `text` instead, which made the paragraph above true of one half and false of the other.
  // Showing an HTML comment marker inside a fence is the only way to write down what this
  // check looks for, and doing so fired it — so the row in ../nytka procedures/lint.md had
  // to describe the marker in words rather than show it. That is exactly the muting this
  // comment warns against, arriving by way of the document that explains the check, and it
  // is what ../nytka TOOL-006 has to clear before either level can be promoted to `error`.
  //
  // Stripping code does not weaken detection, because scaffolded instructions are prose by
  // construction: they are addressed to whoever fills the file in, and an instruction inside
  // a fence would read as sample output rather than as guidance. Every `<!--` in
  // templates/project sits in prose, so a freshly scaffolded package still reports — which
  // is the case this check was written for and the one the tests pin.
  //
  // Both levels are warn, including `unfilled-placeholder`, which shipped as an error and was
  // demoted the same day. ../nytka TOOL-002 rule 3: a new check enters as info or warn and is
  // promoted only after it has been right in practice. Being right on the two projects that
  // prompted it is not that — they came from one template, so it is one observation, not two.
  // Promote when it has been right somewhere nobody predicted.
  for (const [rel, { text }] of docs) {
    if (basename(rel) === 'README.md') continue     // the template READMEs *are* the format docs
    const prose = text
      .replace(/^---\n[\s\S]*?\n---\n/, '')         // frontmatter carries format examples too
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`[^`\n]*`/g, '')
    for (const m of new Set(prose.match(/<[A-Za-z][A-Za-z0-9 _-]*>/g) ?? [])) {
      if (HTML_TAGS.has(m.slice(1, -1).toLowerCase())) continue
      add('warn', 'unfilled-placeholder', rel, `\`${m}\` is a template placeholder — fill it in or delete the line`)
    }
    if (prose.includes('<!--')) {
      add('warn', 'template-comment', rel, 'template instructions (`<!-- ... -->`) still present — scaffolded but not written')
    }
  }

  const order = { error: 0, warn: 1, info: 2 }
  findings.sort((a, b) => order[a.level] - order[b.level] || a.file.localeCompare(b.file))

  const counts = { error: 0, warn: 0, info: 0 }
  findings.forEach(f => counts[f.level]++)

  return { root, today: TODAY, counts, findings, documents: docs.size }
}

// ---------------------------------------------------------------- report

/** The human report, as a string. Identical to what nytka-lint has always printed. */
export function formatReport (result) {
  const { root, today, counts, findings, documents } = result
  const mark = { error: 'ERROR', warn: 'WARN ', info: 'INFO ' }
  const out = [`nytka-lint — ${root}  (today ${today})\n`]
  if (!findings.length) out.push('  clean — no findings\n')
  let lastFile = null
  for (const f of findings) {
    if (f.file !== lastFile) { out.push(`  ${f.file}`); lastFile = f.file }
    out.push(`    ${mark[f.level]} [${f.check}] ${f.message}`)
  }
  out.push(`\n  ${counts.error} error(s), ${counts.warn} warning(s), ${counts.info} info`)
  out.push(`  ${documents} document(s) checked\n`)
  return out.join('\n')
}

/** The machine report. `documents` is deliberately not in it — it never was. */
export function formatJson (result) {
  const { root, today, counts, findings } = result
  return JSON.stringify({ root, today, counts, findings }, null, 2)
}

// ---------------------------------------------------------------- script

function main (argv) {
  const args = argv.slice(2)
  const dir = args.find(a => !a.startsWith('--')) ?? '.'
  const asJson = args.includes('--json')
  const todayArg = args.find(a => a.startsWith('--today='))
  const today = todayArg ? todayArg.split('=')[1] : isoDate()

  let result
  try {
    result = lintProject(dir, { today })
  } catch (e) {
    if (e instanceof LintUsageError) {
      console.error(`nytka-lint: ${e.message}`)
      process.exitCode = e.exitCode
      return
    }
    throw e
  }

  // process.exitCode, not process.exit: to a pipe console.log is asynchronous, and process.exit
  // abandons whatever has not drained. A project with enough findings to fill 8 KB of --json was
  // handing a caller a half-written document and exit 0.
  console.log(asJson ? formatJson(result) : formatReport(result))
  process.exitCode = result.counts.error > 0 ? 1 : 0
}

/**
 * True only when this file is the script node was told to run, so importing it has no side
 * effects.
 *
 * `realpathSync` is not optional. `import.meta.url` is always the resolved real path, while
 * `process.argv[1]` is whatever was typed — and on macOS the system temp directory is a
 * symlink (`/var/folders/…` → `/private/var/folders/…`), so comparing them without resolving
 * silently decides this file is not the entry point and the CLI prints nothing at all.
 * That is exactly how this was found.
 */
function isMain () {
  if (!process.argv[1]) return false
  try { return import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href } catch { return false }
}

if (isMain()) main(process.argv)
