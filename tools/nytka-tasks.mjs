// ---------------------------------------------------------------------------------------
// GENERATED FILE — DO NOT EDIT.
//
// Source:      @nytka/cli/src/lint.mjs
// Regenerate:  npm run vendor  (in the kd-nytka repo, packages/cli)
//
// Committed here on purpose: this repo must be runnable with nothing installed, so the
// lint everyone is asked to run cannot require an npm install first. It is a read-only
// view of a source that lives elsewhere, which is what SPEC P2 permits — one writable
// definition of conformance, synced in one direction.
//
// Editing this file makes the two disagree, and a test in the source repo will fail.
// Install the package instead if you want it as a dependency:  npm i -D @nytka/cli
// ---------------------------------------------------------------------------------------
// nytka task commands — status, next, task, context, init, lint.
//
// Moved here from ../nytka/tools/nytka.mjs on 2026-07-30 under 0010. It was hand-written in a
// repo that publishes nothing, so the only way to use it on another project was to copy the
// file, and it carried a second YAML parser that disagreed with lint's. Both are fixed by it
// living here: the parser is yaml.mjs, shared with lint, and the commands ship in @nytka/cli.
//
// Same two rules as lint.mjs, for the same reason — the vendored copies run under bare node in
// a repo with no node_modules:
//   1. Import nothing but `node:` builtins and sibling modules by relative path.
//   2. Keep exports free of argv and process.exit. runTaskCommand takes its argv and returns an
//      exit code; only the bin decides what to do with it.

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, mkdirSync, copyFileSync } from 'node:fs'
import { join, resolve, dirname, relative, basename } from 'node:path'
import { fileURLToPath } from 'node:url'

import { parseYaml } from './nytka-yaml.mjs'
import { lintProject, formatReport, isoDate } from './nytka-lint.mjs'

/** Thrown when a command was called wrongly. The message is already printed by then. */
class TaskUsageError extends Error {
  constructor () { super('usage'); this.name = 'TaskUsageError'; this.exitCode = 2 }
}

/** templates/project, next to src/ in the package and next to the file when vendored. */
function templatesDir () {
  const here = dirname(fileURLToPath(import.meta.url))
  for (const c of [resolve(here, '..', 'templates', 'project'), resolve(here, 'templates', 'project')]) {
    if (existsSync(c)) return c
  }
  return resolve(here, '..', 'templates', 'project')
}

/**
 * Run one task command. Prints for a human, returns the exit code, never exits the process.
 *
 * @param {string[]} argv   command and options, without node and the script path
 * @param {{cwd?: string, today?: string}} opts
 */
export function runTaskCommand (argv = [], { cwd = process.cwd(), today = isoDate() } = {}) {
  const VALUE_FLAGS = new Set(['today', 'status'])
  const flags = {}
  const positional = []
  const flagErrors = []
  for (let k = 0; k < argv.length; k++) {
    const a = argv[k]
    if (!a.startsWith('--') || a === '--help') { positional.push(a); continue }
    const eq = a.indexOf('=')
    if (eq !== -1) { flags[a.slice(2, eq)] = a.slice(eq + 1); continue }
    const name = a.slice(2)
    if (!VALUE_FLAGS.has(name)) { flagErrors.push(`unknown option --${name}`); continue }
    const next = argv[k + 1]
    if (next === undefined || next.startsWith('--')) flagErrors.push(`--${name} needs a value`)
    else flags[name] = argv[++k]
  }
  const flag = name => (typeof flags[name] === 'string' ? flags[name] : null)
  const TODAY = flag('today') ?? today

  function frontmatter (text, source = 'document') {
    if (!text.startsWith('---')) return { fm: {}, body: text }
    const end = text.indexOf('\n---', 3)
    if (end === -1) return { fm: {}, body: text }
    const block = text.slice(text.indexOf('\n') + 1, end)
    const body = text.slice(text.indexOf('\n', end + 1) + 1)
    return { fm: parseYaml(block, `${source} frontmatter`), body }
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

  const ROOT = findRoot(cwd)
  function requireRoot () {
    if (!ROOT) {
      console.error('nytka: no project.yaml found here or in any parent directory.')
      console.error('       run `nytka init <dir>` to scaffold one.')
      throw new TaskUsageError()
    }
    return ROOT
  }

  const loadProject = () => parseYaml(readFileSync(join(requireRoot(), 'project.yaml'), 'utf8'), 'project.yaml')

  function tasksPath () {
    const p = loadProject()
    const rel = p?.tasks?.registry ?? 'tasks/tasks.yaml'
    return join(ROOT, rel)
  }

  function loadTasks () {
    const file = tasksPath()
    if (!existsSync(file)) return { file, doc: { tasks: [] }, list: [] }
    const doc = parseYaml(readFileSync(file, 'utf8'), relative(ROOT, file))
    return { file, doc, list: Array.isArray(doc.tasks) ? doc.tasks : [] }
  }

  const daysBetween = (a, b) => Math.floor((Date.parse(b) - Date.parse(a)) / 86400000)

  // Surgical line edit — re-serialising would destroy comments and block scalars.
  function setTaskFields (id, fields) {
    const { file, list } = loadTasks()
    const task = list.find(t => String(t.id) === id)
    if (!task) { console.error(`nytka: no task ${id}`); throw new TaskUsageError() }
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

  function runLint (dir, today) {
    // Direct call, not a spawn of the vendored script: inside the package lint is an import, and
    // the standalone copy resolves it as a sibling file. Either way there is one implementation.
    try { return lintProject(dir, { today }) } catch { return null }
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

    const lint = runLint(root, TODAY)
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
      if (!rows.length) {
        // "no tasks" for an unrecognised status would read as an empty backlog. Name the ones
        // that are actually in the file instead.
        if (want) {
          const have = [...new Set(list.map(t => t.status))].sort()
          console.log(`\n  no task has status "${want}" — this file uses: ${have.join(', ') || 'none'}\n`)
        } else console.log('\n  no tasks\n')
        return
      }
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
      if (!t) { console.error(`nytka: no task ${id}`); throw new TaskUsageError() }
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
      if (!id) { console.error(`nytka: task ${sub} needs a task id`); throw new TaskUsageError() }
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
    throw new TaskUsageError()
  }

  function cmdContext (id) {
    const root = requireRoot()
    if (!id) { console.error('nytka: context needs a task id'); throw new TaskUsageError() }
    const p = loadProject()
    const { list } = loadTasks()
    const t = list.find(x => String(x.id) === String(id))
    if (!t) { console.error(`nytka: no task ${id}`); throw new TaskUsageError() }

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
      const { body } = frontmatter(readFileSync(csPath, 'utf8'), 'current-state.md')
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
        const { body } = rel.endsWith('.md') ? frontmatter(raw, rel) : { body: raw }
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
          const { fm } = frontmatter(readFileSync(join(decDir, f), 'utf8'), `decisions/${f}`)
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

  /**
   * Fill the blanks the tool already knows the answer to. A value init can derive is not
   * authoring work, and shipping it as a blank invites exactly one outcome: `<path-to-nytka>`
   * sat in this template for weeks and reached two projects, because it looked like something
   * a human was supposed to write when it was really a lookup.
   */
  function substitute (rel, text, projectName) {
    if (rel === 'project.yaml') return text.replace(/^id: my-project\b/m, `id: ${projectName}`)
    return text.replace(/<project>/g, projectName)
  }

  function cmdInit (target) {
    const src = templatesDir()
    if (!existsSync(src)) { console.error(`nytka: template not found at ${src}`); throw new TaskUsageError() }
    const dest = resolve(target ?? '.')
    const projectName = basename(dest)
    let created = 0, skipped = 0
    const walk = (from, to) => {
      mkdirSync(to, { recursive: true })
      for (const name of readdirSync(from)) {
        // Packaging metadata for the template itself, not project content. It exists only so
        // npm ships the template's `.gitignore` instead of eating it; see templates/.npmignore.
        if (name === '.npmignore') continue
        const f = join(from, name), t = join(to, name)
        if (statSync(f).isDirectory()) walk(f, t)
        else if (existsSync(t)) { skipped++; console.log(`  skip   ${relative(dest, t)}`) }
        else {
          const rel = relative(dest, t)
          if (/\.(md|yaml)$/.test(name)) writeFileSync(t, substitute(rel, readFileSync(f, 'utf8'), projectName))
          else copyFileSync(f, t)
          created++
          console.log(`  create ${rel}`)
        }
      }
    }
    console.log(`\n  scaffolding into ${dest}\n`)
    walk(src, dest)
    console.log(`\n  ${created} created, ${skipped} left alone\n`)

    // Init ends in a lint report rather than in advice. Its old last line was a list of things
    // to remember, which is the same non-enforcement that let a placeholder reach two projects:
    // nothing downstream could tell a filled-in package from a raw copy. Now every remaining
    // blank is a finding with a filename against it, and `nytka lint .` re-asks the question.
    const result = runLint(dest, TODAY)
    if (result) console.log(formatReport(result))
    console.log('  the findings above are the blanks only you can fill — then `git init`.\n')
  }

  function cmdLint (dir) {
    const target = dir ?? ROOT ?? '.'
    const result = runLint(target, TODAY)
    if (!result) { console.error('nytka: lint could not run'); return 2 }
    console.log(formatReport(result))
    return result.counts.error > 0 ? 1 : 0
  }

  // ---------------------------------------------------------------- dispatch

  const [cmd, a, b, c] = positional
  if (flagErrors.length) {
    for (const e of flagErrors) console.error(`nytka: ${e}`)
    console.error('       options are --status <value> and --today <YYYY-MM-DD>\n')
    return 2
  }
  try {
    switch (cmd) {
      case 'status': case undefined: cmdStatus(); return 0
      case 'next': cmdNext(); return 0
      case 'task': cmdTask(a, b, c); return 0
      case 'context': cmdContext(a); return 0
      case 'init': cmdInit(a); return 0
      case 'lint': return cmdLint(a)
      default:
        console.error(`nytka: unknown command "${cmd}"`)
        return 2
    }
  } catch (err) {
    if (err instanceof TaskUsageError) return 2
    // A parse failure must stop the command. Printing a partial backlog as if it were whole is
    // the one outcome this tool must never produce.
    console.error(`\nnytka: ${err.message}\n`)
    return 2
  }
}
