// Tests for the YAML subset nytka.mjs parses. Zero dependencies, like the tool itself.
//
//   node --test tools/
//
// The regression these exist for: on 2026-07-30 a wrapped quoted string in DOC-001.evidence
// made the parser stop reading and return 1 of 7 tasks, with no error and exit code 0. Every
// count the CLI printed was wrong and believable. Counting the whole file after parsing is
// therefore the assertion that matters most here — a parser must never return a partial
// backlog quietly.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

import { parseYaml } from './nytka.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..')

const run = (...args) => {
  const r = spawnSync(process.execPath, [join(HERE, 'nytka.mjs'), ...args], {
    cwd: ROOT, encoding: 'utf8'
  })
  return { out: r.stdout + r.stderr, code: r.status }
}

// ---------------------------------------------------------------- wrapped values

test('a wrapped quoted string in a list does not truncate the document', () => {
  const doc = parseYaml([
    'tasks:',
    '  - id: A',
    '    evidence:',
    '      - "short one"',
    '      - "a claim long enough that it wrapped onto a second line, which is',
    '         legal YAML and is what broke this parser"',
    '    updated: 2026-07-30',
    '  - id: B',
    '  - id: C'
  ].join('\n'))

  assert.equal(doc.tasks.length, 3, 'tasks after the wrapped value must survive')
  assert.deepEqual(doc.tasks.map(t => t.id), ['A', 'B', 'C'])
  assert.equal(doc.tasks[0].updated, '2026-07-30', 'keys after the wrapped value must survive')
  assert.equal(
    doc.tasks[0].evidence[1],
    'a claim long enough that it wrapped onto a second line, which is legal YAML and is what broke this parser',
    'continuation lines fold with a single space, and the quotes come off'
  )
})

test('a wrapped quoted string as a map value folds the same way', () => {
  const doc = parseYaml([
    'title: "one that wrapped',
    '  onto a second line"',
    'status: todo'
  ].join('\n'))
  assert.equal(doc.title, 'one that wrapped onto a second line')
  assert.equal(doc.status, 'todo', 'the key after it is still read')
})

test('a wrapped plain (unquoted) scalar folds too', () => {
  const doc = parseYaml([
    'summary: an unquoted value that carries on',
    '  across two lines',
    'owner: mike'
  ].join('\n'))
  assert.equal(doc.summary, 'an unquoted value that carries on across two lines')
  assert.equal(doc.owner, 'mike')
})

test('a wrapped value spanning three lines folds', () => {
  const doc = parseYaml([
    'evidence:',
    '  - "one',
    '     two',
    '     three"',
    'after: kept'
  ].join('\n'))
  assert.equal(doc.evidence[0], 'one two three')
  assert.equal(doc.after, 'kept')
})

// ---------------------------------------------------------------- quoting edge cases

test('a # inside a quoted string is not a comment', () => {
  const doc = parseYaml('note: "count #4 of 5"   # this part is a comment')
  assert.equal(doc.note, 'count #4 of 5')
})

test('escaped quotes and single-quote doubling survive', () => {
  const doc = parseYaml([
    'a: "she said \\"go\\" and left"',
    "b: 'it''s fine'"
  ].join('\n'))
  assert.equal(doc.a, 'she said "go" and left')
  assert.equal(doc.b, "it's fine")
})

test('an unterminated quoted string is an error, not a truncation', () => {
  assert.throws(
    () => parseYaml(['a: "never closed', 'b: two'].join('\n'), 'fixture.yaml'),
    /unterminated quoted string/
  )
})

// ---------------------------------------------------------------- block scalars and lists

test('| keeps line breaks and > folds them', () => {
  const doc = parseYaml([
    'literal: |',
    '  line one',
    '  line two',
    'folded: >',
    '  line one',
    '  line two',
    'after: kept'
  ].join('\n'))
  assert.equal(doc.literal, 'line one\nline two')
  assert.equal(doc.folded, 'line one line two')
  assert.equal(doc.after, 'kept')
})

test('workLog — a list of maps carrying a block scalar', () => {
  const doc = parseYaml([
    'workLog:',
    '  - at: 2026-07-29',
    '    note: |',
    '      what happened, on',
    '      two lines',
    '  - at: 2026-07-30',
    '    note: "a wrapped one that runs',
    '           onto the next line"',
    'updated: 2026-07-30'
  ].join('\n'))
  assert.equal(doc.workLog.length, 2)
  assert.equal(doc.workLog[0].note, 'what happened, on\ntwo lines')
  assert.equal(doc.workLog[1].note, 'a wrapped one that runs onto the next line')
  assert.equal(doc.updated, '2026-07-30')
})

test('inline collections, including ones that wrap', () => {
  const doc = parseYaml([
    'blockedBy: [A-1, B-2]',
    'empty: []',
    'generated: { by: claude-opus-5, at: 2026-07-30 }',
    'wrapped: [one, two,',
    '          three]',
    'after: kept'
  ].join('\n'))
  assert.deepEqual(doc.blockedBy, ['A-1', 'B-2'])
  assert.deepEqual(doc.empty, [])
  assert.deepEqual(doc.generated, { by: 'claude-opus-5', at: '2026-07-30' })
  assert.deepEqual(doc.wrapped, ['one', 'two', 'three'])
  assert.equal(doc.after, 'kept')
})

test('a list indented level with its key is read, not silently dropped', () => {
  const doc = parseYaml([
    'tasks:',
    '- id: A',
    '- id: B'
  ].join('\n'))
  assert.deepEqual(doc.tasks.map(t => t.id), ['A', 'B'])
})

// ---------------------------------------------------------------- failing loudly

test('content the parser cannot read raises, rather than ending the document', () => {
  // js-yaml rejects this too: "bad indentation of a mapping entry".
  assert.throws(
    () => parseYaml(['a:', '  b: 1', '    c: 2'].join('\n'), 'fixture.yaml'),
    /fixture\.yaml:3/,
    'the error names the file and the line'
  )
})

test('an indented line after a plain scalar is a continuation, not an error', () => {
  // The counterpart to the test above, and the reason it uses the fixture it does: this is
  // legal YAML and js-yaml folds it the same way. Erring on the side of rejection here would
  // trade a silent wrong answer for a noisy one.
  const doc = parseYaml(['a: 1', '    junk here', 'b: 2'].join('\n'))
  assert.equal(doc.a, '1 junk here')
  assert.equal(doc.b, '2')   // this subset does not coerce numbers; dates stay strings too
})

test('a line that is neither key nor list item raises', () => {
  assert.throws(() => parseYaml(['a: 1', 'not a key', 'b: 2'].join('\n')), /expected "key: value"/)
})

// ---------------------------------------------------------------- the real backlog

test('tasks/tasks.yaml parses whole', () => {
  const doc = parseYaml(readFileSync(join(ROOT, 'tasks/tasks.yaml'), 'utf8'), 'tasks/tasks.yaml')

  assert.equal(doc.tasks.length, 7, 'every task in the file is returned')
  assert.deepEqual(
    doc.tasks.map(t => t.id),
    ['DOC-001', 'SPEC-002', 'ADOPT-001', 'SPEC-001', 'TOOL-001', 'TOOL-002', 'SPEC-003']
  )

  const counts = {}
  for (const t of doc.tasks) counts[t.status] = (counts[t.status] ?? 0) + 1
  assert.deepEqual(counts, { done: 1, in_progress: 1, todo: 3, blocked: 1, proposed: 1 })

  const doc001 = doc.tasks[0]
  assert.equal(doc001.evidence.length, 3)
  assert.match(doc001.evidence[2], /^second criterion: mechanical scan only/)
  assert.match(doc001.evidence[2], /the owner has not confirmed\.$/, 'the wrapped tail is kept')
  assert.equal(doc001.created, '2026-07-27', 'keys after evidence survive')
  assert.equal(doc001.updated, '2026-07-30')
})

// ---------------------------------------------------------------- options

test('--status filters in both the space and equals forms', () => {
  const spaced = run('task', 'list', '--status', 'todo')
  const equals = run('task', 'list', '--status=todo')
  assert.match(spaced.out, /3 task\(s\)/, '--status todo used to list all 7 and look like no filter')
  assert.match(equals.out, /3 task\(s\)/)
  assert.equal(spaced.out, equals.out, 'both forms produce the same output')
  for (const id of ['ADOPT-001', 'TOOL-001', 'TOOL-002']) assert.match(spaced.out, new RegExp(id))
  assert.doesNotMatch(spaced.out, /DOC-001/, 'a done task is filtered out')
})

test('a status nothing matches says so, instead of reading as an empty backlog', () => {
  const { out } = run('task', 'list', '--status', 'don')
  assert.match(out, /no task has status "don"/)
  assert.match(out, /blocked, done, in_progress, proposed, todo/, 'it names what the file does use')
})

test('a flag given no value is an error, not a silently ignored filter', () => {
  const bare = run('task', 'list', '--status')
  assert.equal(bare.code, 2)
  assert.match(bare.out, /--status needs a value/)

  const typo = run('task', 'list', '--stats', 'todo')
  assert.equal(typo.code, 2)
  assert.match(typo.out, /unknown option --stats/)
})

test('--today is still read in both forms, and --help still prints help', () => {
  assert.match(run('status', '--today', '2026-09-01').out, /33 days ago/)
  assert.match(run('status', '--today=2026-09-01').out, /33 days ago/)
  assert.match(run('--help').out, /working commands for a nytka project package/)
})

test('a parse failure exits non-zero instead of printing a partial backlog', () => {
  const { out, code } = run('task', 'show', 'NOPE-001')
  assert.equal(code, 2)
  assert.match(out, /no task NOPE-001/)
})

// ---------------------------------------------------------------- line numbers

test('every task keeps its line number, which task edits are written against', () => {
  const doc = parseYaml(readFileSync(join(ROOT, 'tasks/tasks.yaml'), 'utf8'))
  const lines = readFileSync(join(ROOT, 'tasks/tasks.yaml'), 'utf8').split('\n')
  for (const t of doc.tasks) {
    const at = Object.getOwnPropertyDescriptor(t, '__line')?.value
    assert.equal(typeof at, 'number', `${t.id} has a __line`)
    assert.match(lines[at], new RegExp(`- id: ${t.id}\\b`), `${t.id} __line points at its own row`)
  }
})
