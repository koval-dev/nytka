#!/usr/bin/env node
// nytka — working commands for a nytka project package.
// Zero dependencies. Usage: node nytka.mjs <command> [args] [--today YYYY-MM-DD]
//
//   status                  identity, state age, task counts, what is next, lint summary
//   next                    the highest-priority task with nothing blocking it
//   task list [--status s]  every task, one line each
//   task show <id>          one full record
//   task start <id>         status -> in_progress
//   task done <id>          status -> done
//   task block <id> <by>    status -> blocked, blockedBy += <by>
//   context <id>            assemble the bounded context for a task (SPEC.md §10)
//   init [dir]              scaffold a new package from templates/project
//   lint [dir]              delegate to nytka-lint.mjs
//
// Parses only the YAML subset nytka actually uses: nested maps, "- " lists, inline
// [a, b] and {a: b}, and "|" / ">" block scalars. Same deliberate limitation as
// nytka-lint.mjs — a full YAML parser would be a dependency.

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, mkdirSync, copyFileSync } from 'node:fs'
import { join, resolve, dirname, relative, basename } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const HERE = dirname(fileURLToPath(import.meta.url))
const argv = process.argv.slice(2)
const flag = name => {
  const hit = argv.find(a => a.startsWith(`--${name}=`))
  return hit ? hit.split('=').slice(1).join('=') : null
}
const TODAY = flag('today') ?? new Date().toISOString().slice(0, 10)
const positional = argv.filter(a => !a.startsWith('--'))

// ------------------------------------------------------------------ yaml subset

function stripComment (s) {
  let q = null, out = ''
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (q) { out += c; if (c === q) q = null; continue }
    if (c === '"' || c === "'") { q = c; out += c; continue }
    if (c === '#' && (i === 0 || /\s/.test(s[i - 1]))) break
    out += c
  }
  return out
}

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

function scalar (raw) {
  const v = String(raw).trim()
  if (!v) return ''
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) return v.slice(1, -1)
  if (v === 'null' || v === '~') return null
  if (v === 'true') return true
  if (v === 'false') return false
  if (v.startsWith('[') && v.endsWith(']')) {
    const inner = v.slice(1, -1).trim()
    return inner ? splitTop(inner).map(scalar) : []
  }
  if (v.startsWith('{') && v.endsWith('}')) {
    const o = {}
    for (const part of splitTop(v.slice(1, -1))) {
      const i = part.indexOf(':')
      if (i !== -1) o[part.slice(0, i).trim()] = scalar(part.slice(i + 1))
    }
    return o
  }
  return v
}

function parseYaml (text) {
  const lines = text.split('\n').map((raw, n) => ({
    n, raw, body: stripComment(raw), indent: raw.match(/^ */)[0].length
  }))
  let i = 0
  const skip = () => { while (i < lines.length && !lines[i].body.trim()) i++ }

  function readBlock (parentIndent, style) {
    const buf = []
    let base = null
    while (i < lines.length) {
      const L = lines[i]
      if (!L.raw.trim()) { buf.push(''); i++; continue }
      if (L.indent <= parentIndent) break
      if (base === null) base = L.indent
      buf.push(L.raw.slice(base))
      i++
    }
    while (buf.length && buf.at(-1) === '') buf.pop()
    if (style === '>') {
      let out = ''
      for (const l of buf) {
        if (l === '') out += '\n\n'
        else out += (out === '' || out.endsWith('\n\n')) ? l : ' ' + l
      }
      return out.trim()
    }
    return buf.join('\n')
  }

  function parseMap (indent) {
    const out = {}
    while (true) {
      skip()
      if (i >= lines.length) break
      const L = lines[i]
      if (L.indent !== indent) break
      const m = L.body.trim().match(/^([A-Za-z_][\w.-]*)\s*:\s*(.*)$/)
      if (!m) break
      const [, key, rest] = m
      i++
      if (/^[|>]-?\+?$/.test(rest.trim())) out[key] = readBlock(indent, rest.trim()[0])
      else if (rest.trim() === '') { const c = parseNode(indent + 1); out[key] = c === null ? '' : c }
      else out[key] = scalar(rest)
    }
    return out
  }

  function parseList (indent) {
    const out = []
    while (true) {
      skip()
      if (i >= lines.length) break
      const L = lines[i]
      if (L.indent !== indent || !/^-(\s|$)/.test(L.body.trim())) break
      const lineNo = L.n
      const rest = L.body.trim().replace(/^-\s*/, '')
      if (/^[A-Za-z_][\w.-]*\s*:/.test(rest)) {
        const childIndent = indent + 2
        lines[i] = { n: lineNo, raw: L.raw, body: ' '.repeat(childIndent) + rest, indent: childIndent }
        const item = parseMap(childIndent)
        Object.defineProperty(item, '__line', { value: lineNo, enumerable: false })
        out.push(item)
      } else { i++; out.push(scalar(rest)) }
    }
    return out
  }

  function parseNode (minIndent) {
    skip()
    if (i >= lines.length) return null
    const L = lines[i]
    if (L.indent < minIndent) return null
    return /^-(\s|$)/.test(L.body.trim()) ? parseList(L.indent) : parseMap(L.indent)
  }

  return parseNode(0) ?? {}
}

function frontmatter (text) {
  if (!text.startsWith('---')) return { fm: {}, body: text }
  const end = text.indexOf('\n---', 3)
  if (end === -1) return { fm: {}, body: text }
  const block = text.slice(text.indexOf('\n') + 1, end)
  const body = text.slice(text.indexOf('\n', end + 1) + 1)
  return { fm: parseYaml(block), body }
}

// ------------------------------------------------------------------ project

function findRoot (start = process.cwd()) {
  let dir = resolve(start)
  while (true) {
    if (existsSync(join(dir, 'project.yaml'))) return dir
    const up = dirname(dir)
    if (up === dir) return null
    dir = up
  }
}

const ROOT = findRoot()
function requireRoot () {
  if (!ROOT) {
    console.error('nytka: no project.yaml found here or in any parent directory.')
    console.error('       run `nytka init <dir>` to scaffold one.')
    process.exit(2)
  }
  return ROOT
}

const loadProject = () => parseYaml(readFileSync(join(requireRoot(), 'project.yaml'), 'utf8'))

function tasksPath () {
  const p = loadProject()
  const rel = p?.tasks?.registry ?? 'tasks/tasks.yaml'
  return join(ROOT, rel)
}

function loadTasks () {
  const file = tasksPath()
  if (!existsSync(file)) return { file, doc: { tasks: [] }, list: [] }
  const doc = parseYaml(readFileSync(file, 'utf8'))
  return { file, doc, list: Array.isArray(doc.tasks) ? doc.tasks : [] }
}

const daysBetween = (a, b) => Math.floor((Date.parse(b) - Date.parse(a)) / 86400000)

// Surgical line edit — re-serialising would destroy comments and block scalars.
function setTaskFields (id, fields) {
  const { file, list } = loadTasks()
  const task = list.find(t => String(t.id) === id)
  if (!task) { console.error(`nytka: no task ${id}`); process.exit(2) }
  const start = task.__line
  const lines = readFileSync(file, 'utf8').split('\n')
  const itemIndent = lines[start].match(/^ */)[0].length
  let end = lines.length
  for (let n = start + 1; n < lines.length; n++) {
    const l = lines[n]
    if (!l.trim()) continue
    const ind = l.match(/^ */)[0].length
    if (ind <= itemIndent && /^\s*-\s/.test(l)) { end = n; break }
    if (ind <= itemIndent && l.trim() && !/^\s/.test(l)) { end = n; break }
  }
  for (const [key, value] of Object.entries(fields)) {
    const re = new RegExp(`^(\\s*)${key}\\s*:\\s*(.*)$`)
    let done = false
    for (let n = start; n < end; n++) {
      const m = lines[n].match(re)
      if (m && m[1].length > itemIndent - 2) { lines[n] = `${m[1]}${key}: ${value}`; done = true; break }
    }
    if (!done) lines.splice(end - 1, 0, `${' '.repeat(itemIndent + 2)}${key}: ${value}`)
  }
  // bump the registry's own updated: stamp
  for (let n = 0; n < Math.min(lines.length, 10); n++) {
    if (/^updated\s*:/.test(lines[n])) { lines[n] = `updated: "${TODAY}"`; break }
  }
  writeFileSync(file, lines.join('\n'))
  return task
}

// ------------------------------------------------------------------ output

const PRIORITY = { high: 0, medium: 1, low: 2 }
const pad = (s, n) => String(s ?? '').padEnd(n)

function isActionable (t, byId) {
  if (t.status !== 'todo' && t.status !== 'blocked') return false
  const blockers = Array.isArray(t.blockedBy) ? t.blockedBy : []
  return blockers.every(b => byId.get(String(b))?.status === 'done')
}

function runLint (dir) {
  const lint = join(HERE, 'nytka-lint.mjs')
  if (!existsSync(lint)) return null
  const r = spawnSync(process.execPath, [lint, dir, '--json', `--today=${TODAY}`], { encoding: 'utf8' })
  try { return JSON.parse(r.stdout) } catch { return null }
}

// ------------------------------------------------------------------ commands

function cmdStatus () {
  const root = requireRoot()
  const p = loadProject()
  const { list } = loadTasks()
  const byId = new Map(list.map(t => [String(t.id), t]))

  console.log(`\n  ${p.name ?? p.id}  (${p.id})  —  ${p.status ?? 'status unset'}`)
  if (p.purpose?.description) {
    console.log(`  ${String(p.purpose.description).replace(/\s+/g, ' ').trim()}`)
  }
  console.log(`  ${root}\n`)

  const csPath = join(root, 'current-state.md')
  if (existsSync(csPath)) {
    const text = readFileSync(csPath, 'utf8')
    const dates = [...text.matchAll(/\b(20\d{2}-\d{2}-\d{2})\b/g)].map(m => m[1]).sort()
    const newest = dates.at(-1)
    if (!newest) console.log('  current-state.md   no date — cannot tell if it is current')
    else {
      const age = daysBetween(newest, TODAY)
      console.log(`  current-state.md   ${newest} (${age} day${age === 1 ? '' : 's'} ago)${age > 30 ? '   STALE — likely no longer current' : ''}`)
    }
  }

  if (list.length) {
    const counts = {}
    for (const t of list) counts[t.status ?? 'unset'] = (counts[t.status ?? 'unset'] ?? 0) + 1
    console.log(`  tasks              ${Object.entries(counts).map(([k, v]) => `${v} ${k}`).join(', ')}`)
  } else {
    console.log('  tasks              none registered')
  }

  const lint = runLint(root)
  if (lint) {
    const c = lint.counts
    console.log(`  lint               ${c.error} error(s), ${c.warn} warning(s), ${c.info} info`)
  }

  const ready = list.filter(t => isActionable(t, byId))
    .sort((a, b) => (PRIORITY[a.priority] ?? 3) - (PRIORITY[b.priority] ?? 3))
  if (ready.length) {
    console.log('\n  Ready to start')
    for (const t of ready.slice(0, 5)) {
      console.log(`    ${pad(t.id, 10)} ${pad(t.priority ?? '', 7)} ${t.title}`)
    }
    if (ready.length > 5) console.log(`    … and ${ready.length - 5} more`)
  }

  const stuck = list.filter(t => t.status === 'blocked' && !isActionable(t, byId))
  if (stuck.length) {
    console.log('\n  Blocked')
    for (const t of stuck) {
      const on = (Array.isArray(t.blockedBy) ? t.blockedBy : []).filter(b => byId.get(String(b))?.status !== 'done')
      console.log(`    ${pad(t.id, 10)} waiting on ${on.join(', ') || '—'}`)
    }
  }
  console.log()
}

function cmdNext () {
  const { list } = loadTasks()
  const byId = new Map(list.map(t => [String(t.id), t]))
  const ready = list.filter(t => isActionable(t, byId))
    .sort((a, b) => (PRIORITY[a.priority] ?? 3) - (PRIORITY[b.priority] ?? 3))
  if (!ready.length) { console.log('\n  nothing is ready — everything is blocked, done, or in progress\n'); return }
  const t = ready[0]
  console.log(`\n  ${t.id}  ${t.title}`)
  console.log(`  priority ${t.priority ?? 'unset'} · owner ${t.owner ?? 'unassigned'}\n`)
  console.log(`  nytka context ${t.id}     assemble what an agent needs`)
  console.log(`  nytka task start ${t.id}  mark it in progress\n`)
}

function cmdTask (sub, id, arg) {
  const { list } = loadTasks()
  const byId = new Map(list.map(t => [String(t.id), t]))

  if (!sub || sub === 'list') {
    const want = flag('status')
    const rows = list.filter(t => !want || t.status === want)
    if (!rows.length) { console.log('\n  no tasks\n'); return }
    console.log()
    for (const t of rows) {
      const mark = isActionable(t, byId) && t.status !== 'in_progress' ? '>' : ' '
      console.log(`  ${mark} ${pad(t.id, 10)} ${pad(t.status, 13)} ${pad(t.priority ?? '', 7)} ${t.title}`)
    }
    console.log(`\n  ${rows.length} task(s)   > = ready to start\n`)
    return
  }

  if (sub === 'show') {
    const t = byId.get(String(id))
    if (!t) { console.error(`nytka: no task ${id}`); process.exit(2) }
    console.log(`\n  ${t.id}  ${t.title}\n`)
    for (const k of ['status', 'priority', 'owner', 'repo', 'created', 'updated']) {
      if (t[k] != null && t[k] !== '') console.log(`  ${pad(k, 12)} ${t[k]}`)
    }
    const blockers = Array.isArray(t.blockedBy) ? t.blockedBy : []
    if (blockers.length) {
      console.log(`  ${pad('blockedBy', 12)} ${blockers.map(b => `${b} (${byId.get(String(b))?.status ?? '?'})`).join(', ')}`)
    }
    if (t.context) { console.log('\n  Context\n'); console.log(String(t.context).split('\n').map(l => '    ' + l).join('\n')) }
    if (Array.isArray(t.acceptanceCriteria)) {
      console.log('\n  Acceptance criteria\n')
      for (const c of t.acceptanceCriteria) console.log(`    [ ] ${c}`)
    }
    console.log()
    return
  }

  if (sub === 'start' || sub === 'done' || sub === 'block') {
    if (!id) { console.error(`nytka: task ${sub} needs a task id`); process.exit(2) }
    const status = sub === 'start' ? 'in_progress' : sub === 'done' ? 'done' : 'blocked'
    const fields = { status, updated: TODAY }
    if (sub === 'block') {
      const cur = (Array.isArray(byId.get(String(id))?.blockedBy) ? byId.get(String(id)).blockedBy : []).map(String)
      if (arg && !cur.includes(String(arg))) cur.push(String(arg))
      fields.blockedBy = `[${cur.join(', ')}]`
    }
    const t = setTaskFields(String(id), fields)
    console.log(`\n  ${t.id} -> ${status}   (updated ${TODAY})`)
    if (sub === 'done') {
      const unblocked = list.filter(x => (Array.isArray(x.blockedBy) ? x.blockedBy : []).map(String).includes(String(id)))
      if (unblocked.length) {
        console.log('\n  now unblocked (set them to todo when you are ready):')
        for (const x of unblocked) console.log(`    ${pad(x.id, 10)} ${x.title}`)
      }
      console.log('\n  before closing: did anything here become a decision, a procedure,')
      console.log('  research, or a change to current-state.md? Distil it now or lose it.')
    }
    console.log()
    return
  }

  console.error(`nytka: unknown task subcommand "${sub}"`)
  process.exit(2)
}

function cmdContext (id) {
  const root = requireRoot()
  if (!id) { console.error('nytka: context needs a task id'); process.exit(2) }
  const p = loadProject()
  const { list } = loadTasks()
  const t = list.find(x => String(x.id) === String(id))
  if (!t) { console.error(`nytka: no task ${id}`); process.exit(2) }

  const out = []
  out.push(`# Context for ${t.id} — ${t.title}`)
  out.push('')
  out.push(`Assembled ${TODAY} by nytka from ${basename(root)}. This is the task level of`)
  out.push('SPEC.md §10: the narrowest load that answers the question.')
  out.push('')

  out.push('## Project')
  out.push('')
  out.push(`**${p.name ?? p.id}** (\`${p.id}\`) — ${p.status ?? 'status unset'}`)
  if (p.purpose?.description) out.push('', String(p.purpose.description).trim())
  if (p.components && typeof p.components === 'object') {
    out.push('', '| Component | Path | Role |', '|---|---|---|')
    for (const [name, c] of Object.entries(p.components)) {
      const role = String(c?.role ?? c?.framework ?? '').replace(/\s+/g, ' ').trim()
      out.push(`| ${name} | \`${c?.path ?? ''}\` | ${role} |`)
    }
  }
  out.push('')

  const csPath = join(root, 'current-state.md')
  if (existsSync(csPath)) {
    const { body } = frontmatter(readFileSync(csPath, 'utf8'))
    out.push('## Current state', '', body.replace(/^# .*\n/, '').trim(), '')
  }

  out.push('## The task', '')
  out.push(`- **id** ${t.id}`)
  out.push(`- **status** ${t.status}${t.priority ? ` · **priority** ${t.priority}` : ''}${t.owner ? ` · **owner** ${t.owner}` : ''}`)
  const blockers = Array.isArray(t.blockedBy) ? t.blockedBy : []
  if (blockers.length) out.push(`- **blockedBy** ${blockers.join(', ')}`)
  if (t.context) out.push('', String(t.context).trim())
  if (Array.isArray(t.acceptanceCriteria)) {
    out.push('', '**Acceptance criteria**', '')
    for (const c of t.acceptanceCriteria) out.push(`- [ ] ${c}`)
  }
  out.push('')

  // Files the task names — either as a list, or as paths mentioned in its prose.
  const named = new Set()
  const consider = Array.isArray(t.context) ? t.context : []
  for (const c of consider) named.add(String(c))
  const prose = typeof t.context === 'string' ? t.context : ''
  for (const m of prose.matchAll(/(?:^|[\s(`])((?:decisions|procedures|research|artifacts|references|datasets)\/[\w./-]+\.(?:md|ya?ml|json))/g)) {
    named.add(m[1])
  }
  const loaded = []
  for (const rel of named) {
    const abs = join(root, rel)
    if (!existsSync(abs) || statSync(abs).isDirectory()) continue
    loaded.push(rel)
  }
  if (loaded.length) {
    out.push('## Referenced by this task', '')
    for (const rel of loaded) {
      const raw = readFileSync(join(root, rel), 'utf8')
      const { body } = rel.endsWith('.md') ? frontmatter(raw) : { body: raw }
      out.push(`### \`${rel}\``, '', body.trim(), '')
    }
  }

  // Decision index only — titles, not bodies. Enough to know what exists.
  const decDir = join(root, 'decisions')
  if (existsSync(decDir)) {
    const files = readdirSync(decDir).filter(f => /^\d{4}.*\.md$/.test(f)).sort()
    const rest = files.filter(f => !loaded.includes(`decisions/${f}`))
    if (rest.length) {
      out.push('## Other decisions in force', '')
      out.push('Titles only. Load one only if it bears on this task.', '')
      for (const f of rest) {
        const { fm } = frontmatter(readFileSync(join(decDir, f), 'utf8'))
        out.push(`- \`decisions/${f}\` — ${fm.title ?? '(untitled)'}${fm.status && fm.status !== 'stable' ? ` *(${fm.status})*` : ''}`)
      }
      out.push('')
    }
  }

  out.push('## Not loaded, deliberately', '')
  out.push('`research/`, `history/`, `datasets/` payloads and archives are never auto-scanned')
  out.push('(SPEC.md §10). Ask for one by name if this task needs it.')
  out.push('')

  console.log(out.join('\n'))
}

function cmdInit (target) {
  const src = resolve(HERE, '..', 'templates', 'project')
  if (!existsSync(src)) { console.error(`nytka: template not found at ${src}`); process.exit(2) }
  const dest = resolve(target ?? '.')
  let created = 0, skipped = 0
  const walk = (from, to) => {
    mkdirSync(to, { recursive: true })
    for (const name of readdirSync(from)) {
      const f = join(from, name), t = join(to, name)
      if (statSync(f).isDirectory()) walk(f, t)
      else if (existsSync(t)) { skipped++; console.log(`  skip   ${relative(dest, t)}`) }
      else { copyFileSync(f, t); created++; console.log(`  create ${relative(dest, t)}`) }
    }
  }
  console.log(`\n  scaffolding into ${dest}\n`)
  walk(src, dest)
  console.log(`\n  ${created} created, ${skipped} left alone\n`)
  console.log('  next: fill project.yaml and AGENTS.md, delete the directories you do not')
  console.log('  need yet, then `git init` and `nytka status`.\n')
}

function cmdLint (dir) {
  const lint = join(HERE, 'nytka-lint.mjs')
  const r = spawnSync(process.execPath, [lint, dir ?? ROOT ?? '.', `--today=${TODAY}`], { stdio: 'inherit' })
  process.exit(r.status ?? 0)
}

// ------------------------------------------------------------------ dispatch

const [cmd, a, b, c] = positional
switch (cmd) {
  case 'status': case undefined: cmdStatus(); break
  case 'next': cmdNext(); break
  case 'task': cmdTask(a, b, c); break
  case 'context': cmdContext(a); break
  case 'init': cmdInit(a); break
  case 'lint': cmdLint(a); break
  case 'help': case '--help': case '-h':
    console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8')
      .split('\n').filter(l => l.startsWith('//')).map(l => l.slice(3)).join('\n'))
    break
  default:
    console.error(`nytka: unknown command "${cmd}" — try \`nytka help\``)
    process.exit(2)
}
