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
import {
  lintProject, formatReport, formatJson, isoDate,
  TASK_STATUSES, CLOSED_TASK_STATUSES, canonicalTaskStatus, unresolvedBlockers,
} from './nytka-lint.mjs'

/** Thrown when a command was called wrongly. The message is already printed by then. */
class TaskUsageError extends Error {
  constructor () { super('usage'); this.name = 'TaskUsageError'; this.exitCode = 2 }
}

/**
 * Thrown when the project declares a tracker these commands cannot read. Like TaskUsageError,
 * the message is already printed by the time this is thrown.
 */
class TrackerUnsupportedError extends Error {
  constructor (tracker) {
    super(`tracker: ${tracker}`)
    this.name = 'TrackerUnsupportedError'; this.exitCode = 2; this.tracker = tracker
  }
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
  const VALUE_FLAGS = new Set(['today', 'status', 'by', 'owner', 'reason'])
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

  /**
   * The registry these commands read, and what the project says owns the status in it.
   *
   * `tracker` is absent from most project.yaml files and defaults to `file` — that is the
   * default ../nytka/SPEC.md §4 documents, and every project written before this guard existed
   * relies on it.
   */
  function taskSource () {
    const p = loadProject()
    return {
      tracker: String(p?.tasks?.tracker ?? 'file'),
      file: join(ROOT, String(p?.tasks?.registry ?? 'tasks/tasks.yaml')),
    }
  }

  const tasksPath = () => taskSource().file

  /**
   * Refuse to treat a registry as the backlog when the project says something else owns it.
   *
   * §8: on an external tracker the issues own status, the repo holds a GENERATED read-only
   * snapshot, and sync runs tracker → file only, never the reverse. These commands read a
   * registry and five of them write to it, so on any tracker but `file` both halves are wrong.
   * What they would read is a copy; what they would write is a second writable copy of a status
   * the tracker owns, which is P2's named failure and the thing this format exists to prevent.
   *
   * lint has read `tasks.tracker` since C12 and skips its task checks when it is not `file`.
   * These commands never read it. So a project declaring `github-projects` got `nytka status`
   * printing the registry as though it were the backlog, `nytka next` handing an agent work off
   * it, and `nytka task done` writing status into it — every one of them exiting 0. Wrong,
   * believable and exit 0 is this file's recurring failure (../nytka TOOL-005), and it is why
   * this refuses rather than printing an empty pane: an empty pane is the same lie, shorter.
   *
   * Refusing is the whole fix, deliberately. Reading a snapshot is not implemented and is not
   * this guard's to add — nytka ships no tracker integration (../nytka decisions/0004) and the
   * snapshot §4 names is `tasks/snapshot.md`, markdown these commands cannot parse. RT-003 is
   * where a reader would come from, and it has to decide the direction of authority first.
   *
   * Every value that is not `file` refuses, including one §4 does not list. A typo leaves
   * nothing able to say which file is authoritative, and the message names the value it read —
   * so a misspelled tracker is visible in the refusal rather than hidden by a fallback.
   */
  function requireFileTracker () {
    const { tracker, file } = taskSource()
    if (tracker === 'file') return
    const rel = relative(ROOT, file)
    for (const line of [
      '',
      `nytka: this project declares  tasks.tracker: ${tracker}`,
      '',
      '       The task commands read a registry file. On an external tracker that file is not',
      '       authoritative: the tracker owns status and the repo holds a generated read-only',
      `       snapshot (SPEC §8). Reading ${rel} here would report a copy as the backlog,`,
      '       and writing to it would make a second writable copy of a status the tracker owns.',
      '',
      `       nytka ships no reader for ${tracker}. Until it does:`,
      '         · read the backlog in the tracker itself',
      `         · or set  tasks.tracker: file  in project.yaml, if ${rel} really is where`,
      '           status is written',
      '',
    ]) console.error(line)
    throw new TrackerUnsupportedError(tracker)
  }

  function loadTasks () {
    requireFileTracker()
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

  // ------------------------------------------------------------------ the lifecycle
  //
  // SPEC.md §8's seven statuses, read the way §8 reads them. The vocabulary itself is in
  // lint.mjs so there is one copy of it; what belongs here is what each state means for the
  // question these commands answer — "what should I work on next?"
  //
  //   proposed     an idea, not a commitment. NOT startable, and that is the point: a task
  //                leaves `proposed` only when a human is recorded in `acceptedBy`, so a tool
  //                that handed one to `next` would perform the promotion the rule forbids.
  //                It gets its own pane instead, because a proposal nobody sees is a proposal
  //                nobody accepts or declines.
  //   ready        startable. `todo` is the same state under the older spelling and is treated
  //                identically everywhere — §8 documents it as an alias, and nothing here may
  //                report it above `info`.
  //   in_progress  being worked. Not offered again.
  //   blocked      still asked the blocker question, because the answer changes the moment the
  //                last one closes — that is §8's own transition out of it. A `blocked` task
  //                with nothing open therefore reads as ready; lint reports the contradiction,
  //                which is the right division of labour: this command answers what to do now,
  //                lint says the file disagrees with itself.
  //   review       finished, not yet checked against acceptanceCriteria. Work for a person, but
  //                not work to *start* — so it is a pane of its own rather than part of either.
  //   done         closed.
  //   cancelled    closed and will not be done. Terminal like `done`.
  const statusOf = t => canonicalTaskStatus(t?.status)
  const isClosed = t => CLOSED_TASK_STATUSES.has(statusOf(t))

  /**
   * Can this be started right now? `ready` says yes outright; `blocked` says yes the moment
   * nothing in `blockedBy` is still open. Nothing else does — see the note above for why
   * `proposed` is absent, which is the rule 0006 exists for.
   */
  function isActionable (t, byId) {
    const s = statusOf(t)
    if (s !== 'ready' && s !== 'blocked') return false
    return unresolvedBlockers(t, byId).length === 0
  }

  /**
   * Open tasks that cannot move: `blocked` ones, and — the case that has bitten this line twice
   * — ones whose blockers are open while their status says otherwise. §8 makes the two imply
   * each other, and a task holding one half without the other used to appear in neither pane:
   * not startable, so not in "Ready to start"; not `blocked`, so not in "Blocked". Invisible in
   * the tool whose job is to say what is stuck.
   */
  const isStuck = (t, byId) => !isClosed(t) && unresolvedBlockers(t, byId).length > 0

  /**
   * The verbs, and the states §8 says each one is reached from.
   *
   * Two are looser than the table in §8 and both are deliberate:
   *
   *   `done` is listed as reachable from `ready` and `blocked` as well as `review`. §8 routes
   *   finishing through `review`, and the command says so when it is skipped — but refusing
   *   would leave hand-editing the status as the only way to close a small task, and a rule
   *   people route around is not a rule that is being followed.
   *
   *   `block` is reachable from `blocked`, because adding a second blocker to an already
   *   blocked task is the same operation as adding the first.
   *
   * `accept` is the strict one, and it is the rule this whole vocabulary exists for.
   */
  const TRANSITIONS = {
    accept: { to: 'ready', from: ['proposed'] },
    start: { to: 'in_progress', from: ['ready', 'blocked', 'review'] },
    block: { to: 'blocked', from: ['ready', 'in_progress', 'blocked', 'review'] },
    review: { to: 'review', from: ['in_progress'] },
    done: { to: 'done', from: ['ready', 'in_progress', 'blocked', 'review'] },
    cancel: { to: 'cancelled', from: ['proposed', 'ready', 'in_progress', 'blocked', 'review'] },
  }

  /**
   * A value written back into the registry as a quoted scalar. Everything these commands write
   * that is not an id or a date is prose — a reason, an actor — and prose meets `:` and `#`
   * sooner or later. verifyWrite reads the result back through the same parser, so a quoting
   * mistake fails the write rather than corrupting the file, but it should not get that far.
   */
  const yamlString = v => `"${String(v).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\s*\n\s*/g, ' ').trim()}"`

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
    out.waitingOn = unresolvedBlockers(t, byId)
    // The §8 spelling, always present, so a caller need not know `todo` is an alias to group by
    // state. `status` stays exactly what the file says — this is a reading of it, not a
    // correction of it, and rewriting the registry's own word would hide the alias from the
    // one consumer able to report it.
    out.canonicalStatus = canonicalTaskStatus(t.status)
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
    const stuck = list.filter(t => isStuck(t, byId))
    const review = list.filter(t => statusOf(t) === 'review').sort(byPriority)
    const proposed = list.filter(t => statusOf(t) === 'proposed').sort(byPriority)

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
        // The two states §8 added that are neither startable nor finished. An agent asking what
        // needs a human gets `proposed`; one asking what needs checking gets `review`. Both are
        // additive — a caller reading `ready` and `blocked` is unaffected.
        review: review.map(t => taskJson(t, byId)),
        proposed: proposed.map(t => taskJson(t, byId)),
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

    /** One pane, truncated to five — the count is already on the tasks line above. */
    const pane = (heading, rows, line) => {
      if (!rows.length) return
      console.log(`\n  ${heading}`)
      for (const t of rows.slice(0, 5)) console.log(`    ${line(t)}`)
      if (rows.length > 5) console.log(`    … and ${rows.length - 5} more`)
    }

    pane('Ready to start', ready, t => `${pad(t.id, 10)} ${pad(t.priority ?? '', 7)} ${t.title}`)
    pane('In review — check the acceptance criteria, then close or send it back', review,
      t => `${pad(t.id, 10)} ${pad(t.priority ?? '', 7)} ${t.title}`)

    // A stuck task whose status is not `blocked` says so on its own line rather than being
    // silently folded in: §8 makes the two imply each other, so the disagreement is a finding
    // about the file, and printing it as though it were an ordinary blocked task would hide it.
    pane('Blocked', stuck, t => {
      const on = unresolvedBlockers(t, byId).join(', ') || '—'
      const s = statusOf(t)
      return `${pad(t.id, 10)} waiting on ${on}${s === 'blocked' ? '' : `   (status says "${t.status}")`}`
    })

    pane('Proposed — nobody has accepted these yet', proposed,
      t => `${pad(t.id, 10)} ${pad(t.priority ?? '', 7)} ${t.title}`)
    if (proposed.length) console.log('    a human accepts one with:  nytka task accept <id> --by human:<you>')

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
    if (!ready.length) {
      // The old line was "everything is blocked, done, or in progress", which named three
      // states out of seven and was a guess even about those. Count what is actually in the
      // file: with `proposed` and `review` in the vocabulary, "nothing is ready" now has
      // answers that are somebody's next move rather than a dead end.
      const open = s => list.filter(t => statusOf(t) === s).length
      console.log('\n  nothing is ready to start')
      const rows = [
        ['proposed', open('proposed'), 'waiting on a human — nytka task accept <id> --by human:<you>'],
        ['review', open('review'), 'finished, waiting on an acceptance-criteria check'],
        ['in_progress', open('in_progress'), 'already being worked'],
        ['blocked', list.filter(t => isStuck(t, byId)).length, 'waiting on something else in this file'],
      ].filter(([, n]) => n > 0)
      if (rows.length) {
        console.log()
        for (const [name, n, why] of rows) console.log(`    ${pad(n, 3)} ${pad(name, 12)} ${why}`)
      }
      console.log()
      return
    }
    const t = ready[0]
    console.log(`\n  ${t.id}  ${t.title}`)
    console.log(`  priority ${t.priority ?? 'unset'} · owner ${t.owner ?? 'unassigned'}\n`)
    console.log(`  nytka context ${t.id}     assemble what an agent needs`)
    console.log(`  nytka task start ${t.id}  mark it in progress\n`)
  }

  function cmdTask (args) {
    const [sub, id, arg, ...rest] = args
    const { list } = loadTasks()
    const byId = new Map(list.map(t => [String(t.id), t]))

    if (!sub || sub === 'list') {
      const want = flag('status')
      // Alias-aware in both directions: `todo` and `ready` name one state, so asking for either
      // returns both. A filter that answered "no task has status ready" over a file full of
      // `todo` would be the same wrong-and-believable answer this whole change is about.
      const rows = list.filter(t => !want || canonicalTaskStatus(t.status) === canonicalTaskStatus(want))
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
        // `?` is the second half of §8's rule, made visible in the list: an open task waiting on
        // something, whose status does not say `blocked`. It is not startable and it is not
        // stuck-by-declaration, so before this it looked exactly like an ordinary queued task.
        const mark = isActionable(t, byId) ? '>' : (isStuck(t, byId) && statusOf(t) !== 'blocked' ? '?' : ' ')
        console.log(`  ${mark} ${pad(t.id, 10)} ${pad(t.status, 13)} ${pad(t.priority ?? '', 7)} ${t.title}`)
      }
      const odd = rows.some(t => isStuck(t, byId) && statusOf(t) !== 'blocked')
      console.log(`\n  ${rows.length} task(s)   > = ready to start${odd ? '   ? = blockers open, status says otherwise' : ''}\n`)
      return
    }

    if (sub === 'show') {
      const t = byId.get(String(id))
      if (!t) { console.error(`nytka: no task ${id}`); throw new TaskUsageError() }
      if (asJson) return emit({ task: taskJson(t, byId) })
      console.log(`\n  ${t.id}  ${t.title}\n`)
      for (const k of ['status', 'priority', 'owner', 'repo', 'created', 'updated']) {
        if (t[k] == null || t[k] === '') continue
        // The alias is stated where the value is read, not corrected in place. §8 caps this at
        // info for a checker; here it is one parenthesis on the line the reader is already on.
        const note = k === 'status' && canonicalTaskStatus(t[k]) !== String(t[k])
          ? `   (an alias for "${canonicalTaskStatus(t[k])}", SPEC §8)` : ''
        console.log(`  ${pad(k, 12)} ${t[k]}${note}`)
      }
      // The fields §8 attaches to a state. They answer who committed to this work and why it
      // stopped, which a record that shows only `status` cannot — and `acceptedBy` in
      // particular is the whole difference between a task an agent suggested and one a human
      // took on, so leaving it off the record made that distinction invisible where it is read.
      for (const k of ['proposedBy', 'acceptedBy', 'reason', 'completionSummary']) {
        if (t[k] != null && t[k] !== '') console.log(`  ${pad(k, 12)} ${String(t[k]).replace(/\s+/g, ' ').trim()}`)
      }
      const blockers = Array.isArray(t.blockedBy) ? t.blockedBy : []
      if (blockers.length) {
        console.log(`  ${pad('blockedBy', 12)} ${blockers.map(b => `${b} (${byId.get(String(b))?.status ?? 'not in this file'})`).join(', ')}`)
      }
      if (t.context) { console.log('\n  Context\n'); console.log(String(t.context).split('\n').map(l => '    ' + l).join('\n')) }
      if (Array.isArray(t.acceptanceCriteria)) {
        console.log('\n  Acceptance criteria\n')
        for (const c of t.acceptanceCriteria) console.log(`    [ ] ${c}`)
      }
      console.log()
      return
    }

    if (sub in TRANSITIONS) {
      if (!id) { console.error(`nytka: task ${sub} needs a task id`); throw new TaskUsageError() }
      const before = byId.get(String(id))
      if (!before) { console.error(`nytka: no task ${id}`); throw new TaskUsageError() }

      const move = TRANSITIONS[sub]
      refuseTransition(before, sub, move)

      const fields = { status: move.to, updated: TODAY }
      if (sub === 'block') {
        const cur = (Array.isArray(before.blockedBy) ? before.blockedBy : []).map(String)
        if (arg && !cur.includes(String(arg))) cur.push(String(arg))
        fields.blockedBy = `[${cur.join(', ')}]`
      }
      if (sub === 'accept') {
        // Written before `status`, so the registry reads in the order §8 describes: a task is
        // accepted, and that is what makes it `ready`.
        delete fields.status
        fields.acceptedBy = yamlString(acceptedBy())
        // §8 requires a non-empty `owner` from `ready` onward — a proposal has no champion, and
        // the transition is where it acquires one. The accepting human is the default because
        // that is what accepting means; --owner is for handing it to someone else.
        const owner = flag('owner') ?? acceptedBy().replace(/^human:/, '')
        if (!before.owner || String(before.owner).trim() === '') fields.owner = yamlString(owner)
        else if (flag('owner')) fields.owner = yamlString(owner)
        fields.status = move.to
        fields.updated = TODAY
      }
      if (sub === 'cancel') fields.reason = yamlString(cancelReason())

      const t = setTaskFields(String(id), fields)

      // Closing a task can free others, and `cancelled` frees them exactly as `done` does: §8
      // makes both terminal, so a task waiting on a cancelled one is waiting on nothing.
      const frees = sub === 'done' || sub === 'cancel'
      const named = x => (Array.isArray(x.blockedBy) ? x.blockedBy : []).map(String).includes(String(id))

      if (asJson) {
        // Re-read after the write, so what is reported is what the file now says rather than
        // what this process meant to write. That an edit landed at all is setTaskFields'
        // business now — it verifies for every output mode since RT-011, because the human path
        // was the one printing success over a corrupted registry. This read is for the record
        // itself and for what closing the task freed.
        const after = loadTasks()
        const afterById = new Map(after.list.map(x => [String(x.id), x]))
        // Tasks that named this one as a blocker. Only a terminal status can free them, so the
        // other verbs report [] — which is true, not a hole in the shape.
        const freed = frees ? after.list.filter(named) : []
        return emit({
          task: taskJson(afterById.get(String(t.id)), afterById),
          unblocked: freed.map(x => taskJson(x, afterById)),
        })
      }

      console.log(`\n  ${t.id} -> ${move.to}   (updated ${TODAY})`)

      // Starting something whose blockers are still open is allowed — a person may know why —
      // but it leaves the file saying two things at once, and lint now reports that. Say so
      // here rather than letting the finding arrive from somewhere else later.
      if (move.to === 'in_progress') {
        const open = unresolvedBlockers(before, byId)
        if (open.length) {
          console.log(`\n  note: ${open.join(', ')} ${open.length === 1 ? 'is' : 'are'} still open — §8 reads that as \`blocked\`,`)
          console.log('        so lint will report the disagreement until one of the two changes.')
        }
      }
      if (frees) {
        const unblocked = list.filter(named)
        if (unblocked.length) {
          console.log('\n  now unblocked (set them to ready when you are ready to start them):')
          for (const x of unblocked) console.log(`    ${pad(x.id, 10)} ${x.title}`)
        }
      }
      if (sub === 'done') {
        // §8 requires both to ENTER `done`, and this is the transition, so the requirement is
        // live rather than retroactive. The command does not refuse — a registry may carry the
        // record in prose, and refusing would push people to hand-edit the status instead,
        // which is how a rule gets routed around rather than followed.
        const missing = ['completionSummary', 'evidence'].filter(k => {
          const v = before[k]
          return v == null || v === '' || (Array.isArray(v) && !v.length)
        })
        if (missing.length) {
          console.log(`\n  §8 requires ${missing.join(' and ')} to close a task. Add ${missing.length === 1 ? 'it' : 'them'} to`)
          console.log(`  ${relative(ROOT, tasksPath())} — "done" with no evidence is the judgment call acceptanceCriteria removes.`)
        }
        if (statusOf(before) !== 'review') {
          console.log(`\n  closed straight from ${before.status} — §8 routes finishing through \`review\`, which is what`)
          console.log('  stops "done" being assessed by whoever did the work.')
        }
        console.log('\n  before closing: did anything here become a decision, a procedure,')
        console.log('  research, or a change to current-state.md? Distil it now or lose it.')
      }
      if (sub === 'review') {
        console.log('\n  check every acceptance criterion against the live system, then:')
        console.log(`    nytka task done ${t.id}     every criterion met, with evidence`)
        console.log(`    nytka task start ${t.id}    one failed — §8 sends it back rather than closing it`)
      }
      console.log()
      return
    }

    console.error(`nytka: unknown task subcommand "${sub}"`)
    console.error(`       expected list, show, ${Object.keys(TRANSITIONS).join(', ')}`)
    throw new TaskUsageError()

    // ---------------------------------------------------------------- transition guards

    /** `--by`, required and required to name a person. */
    function acceptedBy () {
      const by = flag('by')
      if (!by) {
        console.error('nytka: task accept needs the human accepting it:  --by human:<id>')
        console.error('       SPEC §8 puts a human: actor in `acceptedBy` before a task leaves `proposed`.')
        console.error('       It records who committed to the work, not who ran the command, which is')
        console.error('       why nothing here derives it from project.yaml.')
        throw new TaskUsageError()
      }
      if (!by.startsWith('human:')) {
        console.error(`nytka: --by must name a person, as human:<id> — "${by}" is an actor but not a human.`)
        console.error('       §8 admits `process:` and model ids elsewhere; acceptance is the one field')
        console.error('       they cannot fill, because it is what tells a committed task from a suggested one.')
        throw new TaskUsageError()
      }
      return by
    }

    /** `--reason`, or everything after the id. Required: §8 requires it to enter `cancelled`. */
    function cancelReason () {
      const reason = flag('reason') ?? [arg, ...rest].filter(Boolean).join(' ').trim()
      if (!reason) {
        console.error('nytka: task cancel needs a reason:  nytka task cancel <id> --reason "…"')
        console.error('       §8 requires it. Without one a backlog forgets what it already rejected')
        console.error('       and proposes it again.')
        throw new TaskUsageError()
      }
      return reason
    }

    /** Refuse the transitions §8 does not have, and say which rule refused. */
    function refuseTransition (t, verb, move) {
      const from = statusOf(t)
      if (move.from.includes(from)) return
      // A status this vocabulary does not know is not grounds for refusing to move the task.
      // §13 is explicit that a consumer must not reject a project over an unknown task status,
      // and a command that refused to act on one would be that rejection in miniature — it
      // would also strand every task in a registry that spells its states differently. Lint
      // reports the unknown value at `warn`; here it simply does not stop the work.
      if (!TASK_STATUSES.includes(from)) return

      const say = lines => { for (const l of lines) console.error(l); throw new TaskUsageError() }
      if (from === 'proposed') {
        say([
          `nytka: ${t.id} is proposed — no task leaves \`proposed\` without a human recorded in`,
          '       `acceptedBy` (SPEC §8). Agents may create tasks and may promote none of them.',
          `         nytka task accept ${t.id} --by human:<you>`,
        ])
      }
      if (CLOSED_TASK_STATUSES.has(from)) {
        say([
          `nytka: ${t.id} is ${t.status} — §8 gives that state no exit. A closed record is dated`,
          '       evidence, and reopening it rewrites what was true when it closed. If the work is',
          '       back on, the honest record is a new task that names this one.',
        ])
      }
      if (verb === 'accept') {
        say([
          `nytka: ${t.id} is ${t.status}, not proposed — there is no proposal to accept.`,
          '       `accept` is the proposed -> ready transition and nothing else; a task already in',
          '       the plan was accepted when it got there.',
        ])
      }
      say([
        `nytka: ${t.id} is ${t.status}, and §8 has no ${from} -> ${move.to} transition.`,
        `       ${move.to} is reached from: ${move.from.join(', ')}.`,
      ])
    }
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
    if (t.acceptedBy) out.push(`- **acceptedBy** ${t.acceptedBy}`)
    else if (t.proposedBy) out.push(`- **proposedBy** ${t.proposedBy}`)
    const blockers = Array.isArray(t.blockedBy) ? t.blockedBy : []
    if (blockers.length) out.push(`- **blockedBy** ${blockers.join(', ')}`)
    // This document is what an agent is handed before it starts work, so the one state in which
    // it must not start is stated in it rather than left to be inferred from a status field.
    if (statusOf(t) === 'proposed') {
      out.push('', '> **This task is `proposed` — nobody has accepted it.** Do not start work on it.',
        '> SPEC §8: a task leaves `proposed` only when a human is recorded in `acceptedBy`, and',
        '> an agent may propose work and promote none of it. Read it, add to it, leave the status.')
    }
    if (unresolvedBlockers(t, byId).length) {
      out.push('', `> **Still waiting on ${unresolvedBlockers(t, byId).join(', ')}.** Those are open in this registry.`)
    }
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
    console.error('       options are --json, --status <value>, --today <YYYY-MM-DD>,')
    console.error('       --by human:<id>, --owner <who> and --reason <text>\n')
    return 2
  }
  try {
    switch (cmd) {
      case 'status': case undefined: cmdStatus(); return 0
      case 'next': cmdNext(); return 0
      case 'task': cmdTask(positional.slice(1)); return 0
      case 'context': cmdContext(a); return 0
      case 'init': cmdInit(a); return 0
      case 'lint': return cmdLint(a)
      default:
        console.error(`nytka: unknown command "${cmd}"`)
        return 2
    }
  } catch (err) {
    if (err instanceof TaskUsageError || err instanceof TrackerUnsupportedError) return 2
    // A parse failure must stop the command. Printing a partial backlog as if it were whole is
    // the one outcome this tool must never produce.
    console.error(`\nnytka: ${err.message}\n`)
    return 2
  }
}
