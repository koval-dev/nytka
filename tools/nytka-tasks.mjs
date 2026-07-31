// ---------------------------------------------------------------------------------------
// GENERATED FILE — DO NOT EDIT.
//
// Source:      @nytka/cli/src/tasks.mjs
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
//
// Every command here also answers to `--json`. cli.mjs promised that for the whole CLI from
// 0.2.0 and these five commands rejected the flag outright — see the contract note by taskJson
// for what the shape is and why.

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, mkdirSync, copyFileSync } from 'node:fs'
import { join, resolve, dirname, relative, basename } from 'node:path'
import { fileURLToPath } from 'node:url'

import { parseYaml } from './nytka-yaml.mjs'
import { lintProject, formatReport, formatJson, isoDate } from './nytka-lint.mjs'

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
  const BOOL_FLAGS = new Set(['json'])
  const flags = {}
  const positional = []
  const flagErrors = []
  for (let k = 0; k < argv.length; k++) {
    const a = argv[k]
    if (!a.startsWith('--') || a === '--help') { positional.push(a); continue }
    const eq = a.indexOf('=')
    if (eq !== -1) {
      // The `--x=y` form used to be taken on trust, so `--stats=todo` set a key nobody read and
      // the command listed the whole backlog as if no filter had been asked for. The spaced form
      // has always rejected an unknown name; this one now agrees with it.
      const name = a.slice(2, eq)
      if (!VALUE_FLAGS.has(name) && !BOOL_FLAGS.has(name)) flagErrors.push(`unknown option --${name}`)
      else flags[name] = a.slice(eq + 1)
      continue
    }
    const name = a.slice(2)
    if (BOOL_FLAGS.has(name)) { flags[name] = true; continue }
    if (!VALUE_FLAGS.has(name)) { flagErrors.push(`unknown option --${name}`); continue }
    const next = argv[k + 1]
    if (next === undefined || next.startsWith('--')) flagErrors.push(`--${name} needs a value`)
    else flags[name] = argv[++k]
  }
  const flag = name => (typeof flags[name] === 'string' ? flags[name] : null)
  const TODAY = flag('today') ?? today
  // `--json=false` is not a documented form, but reading it as "yes" is the one answer that
  // would be actively wrong, and a caller building argv from a config file will write it.
  const asJson = 'json' in flags && flags.json !== 'false'
  const emit = data => console.log(JSON.stringify(data, null, 2))

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
    const priorText = readFileSync(file, 'utf8')
    const lines = priorText.split('\n')
    const itemIndent = lines[start].match(/^ */)[0].length
    let end = lines.length
    for (let n = start + 1; n < lines.length; n++) {
      const l = lines[n]
      if (!l.trim()) continue
      const ind = l.match(/^ */)[0].length
      if (ind <= itemIndent && /^\s*-\s/.test(l)) { end = n; break }
      if (ind <= itemIndent && l.trim() && !/^\s/.test(l)) { end = n; break }
    }

    /**
     * A line between two tasks that belongs to neither. Blank ones, and comments at or outside
     * the item's own indent — both registries in the line introduce groups of tasks with a
     * `# ---- phase 1` header, and a key spliced into one of those blocks parses but reads as
     * sitting on the wrong side of it. A comment indented deeper is left alone: it may be a
     * line of a `context: |` block rather than a comment at all.
     */
    const betweenTasks = l =>
      !l.trim() || (l.match(/^ */)[0].length <= itemIndent && l.trimStart().startsWith('#'))

    for (const [key, value] of Object.entries(fields)) {
      const re = new RegExp(`^(\\s*)${key}\\s*:\\s*(.*)$`)
      let done = false
      for (let n = start; n < end; n++) {
        const m = lines[n].match(re)
        if (m && m[1].length > itemIndent - 2) { lines[n] = `${m[1]}${key}: ${value}`; done = true; break }
      }
      if (done) continue
      // `end` is where the NEXT task starts, and the scan above steps over blank lines to reach
      // it — so `end - 1` is this task's last line only when a blank line, or the empty final
      // element of a newline-terminated file, happens to sit there. Where one task is followed
      // immediately by the next `- id:`, `end - 1` IS the last line, and splicing at it put the
      // new key one line too high: inside a trailing acceptanceCriteria list, leaving the whole
      // registry unparseable while `task block` still printed its success line (RT-011). Walk
      // back to the last line that is this task's and insert after it, so the two shapes that
      // were right by accident are right on purpose.
      let at = end - 1
      while (at > start && betweenTasks(lines[at])) at--
      lines.splice(at + 1, 0, `${' '.repeat(itemIndent + 2)}${key}: ${value}`)
      end++   // the boundary moved down with the line, so a second new field lands after the first
    }
    // bump the registry's own updated: stamp
    for (let n = 0; n < Math.min(lines.length, 10); n++) {
      if (/^updated\s*:/.test(lines[n])) { lines[n] = `updated: "${TODAY}"`; break }
    }
    writeFileSync(file, lines.join('\n'))
    verifyWrite(file, id, fields, list, priorText)
    return task
  }

  /**
   * Read the registry back and prove the edit landed where it was meant to — for every caller,
   * not only for `--json`.
   *
   * setTaskFields splices lines into a hand-maintained file, so a block boundary it reads
   * wrongly destroys real work. RT-011 was exactly that: `task block` printed `A-1 -> blocked`,
   * exited 0, and left a file that no longer parsed, after which `status` reported no tasks at
   * all. A believable wrong answer is the one failure this tool exists to prevent, and it does
   * not stop being one because the output mode is a terminal rather than JSON.
   *
   * Restoring rather than only reporting: loadTasks parsed the pre-image strictly a moment ago,
   * so putting those bytes back is a return to a state known to be readable, not a guess. The
   * alternative hands the owner a hand-repair job for an edit they never made by hand.
   */
  function verifyWrite (file, id, fields, priorList, priorText) {
    const rel = relative(ROOT, file)
    const abandon = why => {
      writeFileSync(file, priorText)
      throw new Error(`the edit to ${id} did not land — ${rel} is unchanged.\n  ${why}`)
    }

    let doc
    try { doc = parseYaml(readFileSync(file, 'utf8'), rel) } catch (err) { abandon(err.message) }

    const now = Array.isArray(doc?.tasks) ? doc.tasks : []
    const wrong = []
    if (now.length !== priorList.length) wrong.push(`the file now holds ${now.length} tasks, not ${priorList.length}`)

    const written = now.find(t => String(t.id) === id)
    if (!written) wrong.push(`${id} is no longer in the file`)
    // Compared through the same reader that will read the file next, so this asks what the
    // registry now says rather than whether the bytes match what was written.
    else for (const [key, value] of Object.entries(fields)) {
      const want = parseYaml(`${key}: ${value}`, rel)[key]
      if (JSON.stringify(written[key]) !== JSON.stringify(want)) {
        wrong.push(`${id}.${key} reads ${JSON.stringify(written[key] ?? null)}, not ${JSON.stringify(want)}`)
      }
    }

    // One task was edited, so every other one must come back identical. This is what catches an
    // edit that parses but attached itself to the neighbour.
    const was = new Map(priorList.map(t => [String(t.id), JSON.stringify(t)]))
    for (const t of now) {
      const other = String(t.id)
      if (other !== id && was.get(other) !== JSON.stringify(t)) {
        wrong.push(`${other} changed, and the edit was to ${id}`)
        break
      }
    }

    if (wrong.length) abandon(wrong.join('\n  '))
  }

  // ------------------------------------------------------------------ output

  const PRIORITY = { high: 0, medium: 1, low: 2 }
  const pad = (s, n) => String(s ?? '').padEnd(n)
  const byPriority = (a, b) => (PRIORITY[a.priority] ?? 3) - (PRIORITY[b.priority] ?? 3)

  function isActionable (t, byId) {
    if (t.status !== 'todo' && t.status !== 'blocked') return false
    const blockers = Array.isArray(t.blockedBy) ? t.blockedBy : []
    return blockers.every(b => byId.get(String(b))?.status === 'done')
  }

  // ---------------------------------------------------------------- the --json contract
  //
  // One task shape, everywhere a task appears. The consumers this is being built for — a
  // github-projects provider under SPEC §8, an MCP adapter, an agent running `next --json` to
  // pick work — all need to hand the same record to each other, so a per-command projection
  // would only push the reconciling onto them.
  //
  // Rules the shape keeps:
  //   · SPEC.md §8's fields come first and are always present. An absent scalar is null and an
  //     absent list is [], so nothing has to guard a key before reading it.
  //   · Everything else the registry declares passes through. §8 is a minimum, not a ceiling —
  //     the two live backlogs already carry repo, evidence, workLog and proposedBy, and a
  //     provider syncing a backlog out and back would drop them to a strict projection.
  //     `__line` is non-enumerable in yaml.mjs and so stays out of this on its own.
  //   · Errors stay plain text on stderr with a non-zero exit, as they do for `check --json`
  //     and `info --json`. Machine callers read the exit code; a JSON error object here would
  //     be a shape only this file speaks.

  const SPEC_FIELDS = ['id', 'title', 'status', 'priority', 'owner', 'blockedBy', 'context',
    'acceptanceCriteria', 'created', 'updated']
  const SPEC_LISTS = new Set(['blockedBy', 'acceptanceCriteria'])

  /**
   * `actionable` and `waitingOn` are computed, not read. They are the `>` marker and the
   * "waiting on X, Y" line the human output prints, which a caller could otherwise only recover
   * by reimplementing isActionable against the whole registry. They are assigned last so a
   * registry that happens to declare either key cannot shadow the computed answer.
   */
  function taskJson (t, byId) {
    const out = {}
    for (const k of SPEC_FIELDS) {
      const v = t[k]
      out[k] = SPEC_LISTS.has(k) ? (Array.isArray(v) ? v.map(String) : []) : (v ?? null)
    }
    for (const [k, v] of Object.entries(t)) if (!(k in out)) out[k] = v
    out.actionable = isActionable(t, byId)
    out.waitingOn = out.blockedBy.filter(b => byId.get(b)?.status !== 'done')
    return out
  }

  /** The identity block, shared by status and context so they cannot describe it differently. */
  const projectJson = p => ({
    id: p?.id ?? null,
    name: p?.name ?? null,
    status: p?.status ?? null,
    description: p?.purpose?.description ? String(p.purpose.description).replace(/\s+/g, ' ').trim() : null,
    components: p?.components && typeof p.components === 'object' ? p.components : null,
  })

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

    const csPath = join(root, 'current-state.md')
    let currentState = null
    if (existsSync(csPath)) {
      const text = readFileSync(csPath, 'utf8')
      const dates = [...text.matchAll(/\b(20\d{2}-\d{2}-\d{2})\b/g)].map(m => m[1]).sort()
      const newest = dates.at(-1) ?? null
      const age = newest ? daysBetween(newest, TODAY) : null
      // null rather than false when the file carries no date: "cannot tell" is what the human
      // line says, and a machine reading `stale: false` would take it for a fresh document.
      currentState = { path: relative(root, csPath), date: newest, ageDays: age, stale: newest ? age > 30 : null }
    }

    const byStatus = {}
    for (const t of list) byStatus[t.status ?? 'unset'] = (byStatus[t.status ?? 'unset'] ?? 0) + 1

    const lint = runLint(root, TODAY)
    const ready = list.filter(t => isActionable(t, byId)).sort(byPriority)
    const stuck = list.filter(t => t.status === 'blocked' && !isActionable(t, byId))

    if (asJson) {
      return emit({
        root,
        today: TODAY,
        project: projectJson(p),
        currentState,
        tasks: { total: list.length, byStatus },
        // Counts only. status is the overview; `check --json` is where the findings live.
        lint: lint ? lint.counts : null,
        // Every ready task, where the human view stops at five and says "… and N more".
        // Truncation is a decision about a terminal, and a caller cannot undo it.
        ready: ready.map(t => taskJson(t, byId)),
        blocked: stuck.map(t => taskJson(t, byId)),
      })
    }

    console.log(`\n  ${p.name ?? p.id}  (${p.id})  —  ${p.status ?? 'status unset'}`)
    if (p.purpose?.description) {
      console.log(`  ${String(p.purpose.description).replace(/\s+/g, ' ').trim()}`)
    }
    console.log(`  ${root}\n`)

    if (currentState) {
      if (!currentState.date) console.log('  current-state.md   no date — cannot tell if it is current')
      else {
        const age = currentState.ageDays
        console.log(`  current-state.md   ${currentState.date} (${age} day${age === 1 ? '' : 's'} ago)${currentState.stale ? '   STALE — likely no longer current' : ''}`)
      }
    }

    if (list.length) {
      console.log(`  tasks              ${Object.entries(byStatus).map(([k, v]) => `${v} ${k}`).join(', ')}`)
    } else {
      console.log('  tasks              none registered')
    }

    if (lint) {
      const c = lint.counts
      console.log(`  lint               ${c.error} error(s), ${c.warn} warning(s), ${c.info} info`)
    }

    if (ready.length) {
      console.log('\n  Ready to start')
      for (const t of ready.slice(0, 5)) {
        console.log(`    ${pad(t.id, 10)} ${pad(t.priority ?? '', 7)} ${t.title}`)
      }
      if (ready.length > 5) console.log(`    … and ${ready.length - 5} more`)
    }

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
    const ready = list.filter(t => isActionable(t, byId)).sort(byPriority)
    // `{ task: null }` rather than an empty object or a bare `null`: an agent asking what to work
    // on gets one key to read either way, and "nothing is ready" is an answer, not a failure —
    // which is why this stays exit 0.
    if (asJson) return emit({ task: ready.length ? taskJson(ready[0], byId) : null })
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
      // The filter is echoed back because an empty result has two causes — a backlog with no
      // such task, and a status nobody uses. The human branch below disambiguates them in prose;
      // for a caller, seeing what it actually asked for does the same job.
      if (asJson) return emit({ filter: { status: want }, tasks: rows.map(t => taskJson(t, byId)) })
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
      if (asJson) return emit({ task: taskJson(t, byId) })
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

      if (asJson) {
        // Re-read after the write, so what is reported is what the file now says rather than
        // what this process meant to write. That an edit landed at all is setTaskFields'
        // business now — it verifies for every output mode since RT-011, because the human path
        // was the one printing success over a corrupted registry. This read is for the record
        // itself and for what closing the task freed.
        const after = loadTasks()
        const afterById = new Map(after.list.map(x => [String(x.id), x]))
        // Tasks that named this one as a blocker. Only `done` can free them, so start and block
        // report [] — which is true, not a hole in the shape.
        const freed = sub !== 'done' ? [] : after.list
          .filter(x => (Array.isArray(x.blockedBy) ? x.blockedBy : []).map(String).includes(String(id)))
        return emit({
          task: taskJson(afterById.get(String(t.id)), afterById),
          unblocked: freed.map(x => taskJson(x, afterById)),
        })
      }

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
    const byId = new Map(list.map(x => [String(x.id), x]))
    const t = byId.get(String(id))
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

    const loaded = []
    const csPath = join(root, 'current-state.md')
    if (existsSync(csPath)) {
      const { body } = frontmatter(readFileSync(csPath, 'utf8'), 'current-state.md')
      out.push('## Current state', '', body.replace(/^# .*\n/, '').trim(), '')
      loaded.push('current-state.md')
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
    const referenced = []
    for (const rel of named) {
      const abs = join(root, rel)
      if (!existsSync(abs) || statSync(abs).isDirectory()) continue
      referenced.push(rel)
    }
    if (referenced.length) {
      out.push('## Referenced by this task', '')
      for (const rel of referenced) {
        const raw = readFileSync(join(root, rel), 'utf8')
        const { body } = rel.endsWith('.md') ? frontmatter(raw, rel) : { body: raw }
        out.push(`### \`${rel}\``, '', body.trim(), '')
        loaded.push(rel)
      }
    }

    // Decision index only — titles, not bodies. Enough to know what exists.
    const decDir = join(root, 'decisions')
    const decisions = []
    if (existsSync(decDir)) {
      const files = readdirSync(decDir).filter(f => /^\d{4}.*\.md$/.test(f)).sort()
      for (const f of files.filter(f => !referenced.includes(`decisions/${f}`))) {
        const { fm } = frontmatter(readFileSync(join(decDir, f), 'utf8'), `decisions/${f}`)
        decisions.push({ path: `decisions/${f}`, title: fm.title ?? null, status: fm.status ?? null })
      }
      if (decisions.length) {
        out.push('## Other decisions in force', '')
        out.push('Titles only. Load one only if it bears on this task.', '')
        for (const d of decisions) {
          out.push(`- \`${d.path}\` — ${d.title ?? '(untitled)'}${d.status && d.status !== 'stable' ? ` *(${d.status})*` : ''}`)
        }
        out.push('')
      }
    }

    const notLoaded = ['research/', 'history/', 'datasets/']
    out.push('## Not loaded, deliberately', '')
    out.push(`\`${notLoaded.join('`, `')}\` payloads and archives are never auto-scanned`)
    out.push('(SPEC.md §10). Ask for one by name if this task needs it.')
    out.push('')

    if (asJson) {
      return emit({
        root,
        today: TODAY,
        project: projectJson(p),
        task: taskJson(t, byId),
        // The assembled document is what this command is for. Handing back the parts and making
        // the caller reassemble them would leave `--json` strictly less useful than no flag, so
        // the markdown ships as-is and the rest of this object is its provenance: which files
        // went into it, which decisions were named but left unopened, and which trees SPEC §10
        // says are never swept. Bodies appear once, in the markdown, and are not repeated here.
        markdown: out.join('\n'),
        loaded,
        decisions,
        notLoaded,
      })
    }

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

  /**
   * init gets `--json` too, rather than being carved out of the promise the help text makes.
   *
   * The case against: init is scaffolding, and what it prints is progress rather than data. The
   * case that won: that progress is already a list of paths plus a lint report, and a caller
   * acts on both — an agent scaffolding unattended needs to know which files it now owns and
   * which blanks are still open, and without this it can only learn that by scraping
   * `create <path>` lines back out of a terminal transcript.
   *
   * The alternative was to leave init out and have the help text name the commands that do take
   * the flag. That trades one sentence which stays true for a list that has to be re-checked
   * every time a command is added — the exact drift this whole change exists to undo.
   */
  function cmdInit (target) {
    const src = templatesDir()
    if (!existsSync(src)) { console.error(`nytka: template not found at ${src}`); throw new TaskUsageError() }
    const dest = resolve(target ?? '.')
    const projectName = basename(dest)
    const created = [], skipped = []
    const walk = (from, to) => {
      mkdirSync(to, { recursive: true })
      for (const name of readdirSync(from)) {
        const f = join(from, name)
        // The template carries it undotted and it is written out dotted. npm mangles this one
        // filename in BOTH directions: it will not publish a file named `.gitignore`, and on
        // install it renames any `.gitignore` in a tarball to `.npmignore`. 0.3.1 lost the file
        // to the first half; the `.npmignore` fix that followed cleared the tarball and was
        // beaten by the second half, so a package installed from the registry still had no
        // gitignore to scaffold from. A name npm has no opinion about survives both.
        const out = name === 'gitignore' ? '.gitignore' : name
        const t = join(to, out)
        if (statSync(f).isDirectory()) walk(f, t)
        else if (existsSync(t)) { skipped.push(relative(dest, t)); if (!asJson) console.log(`  skip   ${relative(dest, t)}`) }
        else {
          const rel = relative(dest, t)
          if (/\.(md|yaml)$/.test(name)) writeFileSync(t, substitute(rel, readFileSync(f, 'utf8'), projectName))
          else copyFileSync(f, t)
          created.push(rel)
          if (!asJson) console.log(`  create ${rel}`)
        }
      }
    }
    if (!asJson) console.log(`\n  scaffolding into ${dest}\n`)
    walk(src, dest)

    // Init ends in a lint report rather than in advice. Its old last line was a list of things
    // to remember, which is the same non-enforcement that let a placeholder reach two projects:
    // nothing downstream could tell a filled-in package from a raw copy. Now every remaining
    // blank is a finding with a filename against it, and `nytka lint .` re-asks the question.
    const result = runLint(dest, TODAY)

    // The findings are the payload for a caller too, so they come through structured rather than
    // as the rendered report — counts and findings, matching lint's own --json under those keys.
    if (asJson) {
      return emit({
        root: dest,
        today: TODAY,
        created,
        skipped,
        lint: result ? { counts: result.counts, findings: result.findings } : null,
      })
    }

    console.log(`\n  ${created.length} created, ${skipped.length} left alone\n`)
    if (result) console.log(formatReport(result))
    console.log('  the findings above are the blanks only you can fill — then `git init`.\n')
  }

  function cmdLint (dir) {
    const target = dir ?? ROOT ?? '.'
    const result = runLint(target, TODAY)
    if (!result) { console.error('nytka: lint could not run'); return 2 }
    console.log(asJson ? formatJson(result) : formatReport(result))
    return result.counts.error > 0 ? 1 : 0
  }

  // ---------------------------------------------------------------- dispatch

  const [cmd, a, b, c] = positional
  if (flagErrors.length) {
    for (const e of flagErrors) console.error(`nytka: ${e}`)
    console.error('       options are --json, --status <value> and --today <YYYY-MM-DD>\n')
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
