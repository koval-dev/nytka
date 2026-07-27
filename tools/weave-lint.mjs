#!/usr/bin/env node
// weave-lint — health check for a weave project package.
// Zero dependencies. Usage: node weave-lint.mjs [dir] [--json] [--today YYYY-MM-DD]
//
// Parses only the weave frontmatter subset (SPEC.md §5): scalars, inline {a: b} maps,
// inline [a, b] lists, and "- " list items including inline maps. That is deliberate —
// a full YAML parser would be a dependency, and the vocabulary is small on purpose.

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, relative, extname, basename, dirname, resolve } from 'node:path'

const args = process.argv.slice(2)
const root = resolve(args.find(a => !a.startsWith('--')) ?? '.')
const asJson = args.includes('--json')
const todayArg = args.find(a => a.startsWith('--today='))
const TODAY = todayArg ? todayArg.split('=')[1] : new Date().toISOString().slice(0, 10)

const SKIP_DIRS = new Set(['.git', 'node_modules', 'private', '.claude', 'templates'])
// Files exempt from the frontmatter requirement (SPEC.md §13).
const EXEMPT = new Set(['README.md', 'CLAUDE.md', 'AGENTS.md', 'LICENSE.md', 'CHANGELOG.md'])
const VALID_STATUS = new Set(['draft', 'stable', 'deprecated', 'superseded'])
const VALID_CONFIDENCE = new Set(['stated', 'inferred', 'ambiguous'])
// current-state.md is considered stale after this many days without an update.
const CURRENT_STATE_MAX_AGE_DAYS = 30

const findings = []
const add = (level, check, file, message) => findings.push({ level, check, file, message })

// ---------------------------------------------------------------- frontmatter

function parseScalar (raw) {
  let v = raw.trim()
  if (!v) return ''
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    return v.slice(1, -1)
  }
  if (v === 'null' || v === '~') return null
  if (v === 'true') return true
  if (v === 'false') return false
  return v
}

function parseInline (raw) {
  const v = raw.trim()
  if (v.startsWith('{') && v.endsWith('}')) {
    const obj = {}
    for (const part of splitTop(v.slice(1, -1))) {
      const i = part.indexOf(':')
      if (i === -1) continue
      obj[part.slice(0, i).trim()] = parseScalar(part.slice(i + 1))
    }
    return obj
  }
  if (v.startsWith('[') && v.endsWith(']')) {
    const inner = v.slice(1, -1).trim()
    return inner ? splitTop(inner).map(x => parseInline(x)) : []
  }
  return parseScalar(v)
}

// Split on commas that are not nested inside {} [] or quotes.
function splitTop (s) {
  const out = []
  let depth = 0, cur = '', quote = null
  for (const ch of s) {
    if (quote) { cur += ch; if (ch === quote) quote = null; continue }
    if (ch === '"' || ch === "'") { quote = ch; cur += ch; continue }
    if (ch === '{' || ch === '[') depth++
    if (ch === '}' || ch === ']') depth--
    if (ch === ',' && depth === 0) { out.push(cur); cur = ''; continue }
    cur += ch
  }
  if (cur.trim()) out.push(cur)
  return out.map(x => x.trim()).filter(Boolean)
}

function parseFrontmatter (text) {
  if (!text.startsWith('---')) return null
  const end = text.indexOf('\n---', 3)
  if (end === -1) return null
  const block = text.slice(text.indexOf('\n') + 1, end)
  const data = {}
  let currentKey = null
  for (const line of block.split('\n')) {
    if (!line.trim() || line.trim().startsWith('#')) continue
    const listItem = line.match(/^\s*-\s+(.*)$/)
    if (listItem && currentKey) {
      if (!Array.isArray(data[currentKey])) data[currentKey] = []
      data[currentKey].push(parseInline(listItem[1]))
      continue
    }
    const kv = line.match(/^([A-Za-z_][\w-]*)\s*:\s*(.*)$/)
    if (!kv) continue
    const [, key, rest] = kv
    currentKey = key
    data[key] = rest.trim() === '' ? [] : parseInline(rest)
  }
  return data
}

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

if (!existsSync(root)) {
  console.error(`weave-lint: no such directory: ${root}`)
  process.exit(2)
}

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

// ---------------------------------------------------------------- report

const order = { error: 0, warn: 1, info: 2 }
findings.sort((a, b) => order[a.level] - order[b.level] || a.file.localeCompare(b.file))

const counts = { error: 0, warn: 0, info: 0 }
findings.forEach(f => counts[f.level]++)

if (asJson) {
  console.log(JSON.stringify({ root, today: TODAY, counts, findings }, null, 2))
} else {
  const mark = { error: 'ERROR', warn: 'WARN ', info: 'INFO ' }
  console.log(`weave-lint — ${root}  (today ${TODAY})\n`)
  if (!findings.length) console.log('  clean — no findings\n')
  let lastFile = null
  for (const f of findings) {
    if (f.file !== lastFile) { console.log(`  ${f.file}`); lastFile = f.file }
    console.log(`    ${mark[f.level]} [${f.check}] ${f.message}`)
  }
  console.log(`\n  ${counts.error} error(s), ${counts.warn} warning(s), ${counts.info} info`)
  console.log(`  ${docs.size} document(s) checked\n`)
}

process.exit(counts.error > 0 ? 1 : 0)
