#!/usr/bin/env node
// ---------------------------------------------------------------------------------------
// GENERATED FILE — DO NOT EDIT.
//
// Source:      @nytka/cli/src/bin.mjs
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
// nytka — the task commands, runnable with nothing installed.
//
//   status                  identity, state age, task counts, what is next, lint summary
//   next                    the highest-priority task with nothing blocking it
//   task list [--status s]  every task, one line each
//   task show <id>          one full record
//   task accept <id>        proposed -> ready.  needs --by human:<id>
//   task start <id>         status -> in_progress
//   task review <id>        status -> review, when the work is finished and unchecked
//   task done <id>          status -> done
//   task block <id> <by>    status -> blocked, blockedBy += <by>
//   task cancel <id>        status -> cancelled.  needs --reason "…"
//   context <id>            assemble the bounded context for a task (SPEC.md §10)
//   init [dir]              scaffold a new package from templates/project
//   lint [dir]              run the format checks
//
// Options: --json, --status <value>, --today <YYYY-MM-DD>, --by, --owner, --reason
//
// --json applies to every command above. Task records follow SPEC.md §8 field for field, so a
// backlog read here and a backlog read from a tracker describe a task the same way.
//
// The statuses are SPEC.md §8's — proposed, ready, in_progress, blocked, review, done,
// cancelled — and `todo` is a documented alias for `ready`, read as one everywhere here.
// Only `task accept` moves a task out of `proposed`, and only with a human: actor: agents may
// create tasks freely and may promote none of them.
//
// This is the thin end of the tool. Everything it does lives in tasks.mjs, which is shared with
// `nytka <command>` from the installed package — so the committed copy and the published CLI
// cannot drift into disagreeing about what a backlog says.

import { readFileSync, realpathSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { runTaskCommand } from './nytka-tasks.mjs'

/** The comment block above, which is the help text. */
export function usage () {
  return readFileSync(fileURLToPath(import.meta.url), 'utf8')
    .split('\n').filter(l => l.startsWith('//')).map(l => l.slice(3)).join('\n')
}

// realpathSync, not resolve: import.meta.url is always the real path while argv[1] is whatever
// was typed, so comparing them unresolved makes this false whenever the file is reached through
// a symlink — /tmp and a global npm bin are both symlinks — and the command then does nothing
// at all, silently, exit 0.
function isMain () {
  if (!process.argv[1]) return false
  try { return realpathSync(process.argv[1]) === fileURLToPath(import.meta.url) } catch { return false }
}

// process.exitCode, not process.exit. To a pipe, console.log is asynchronous, and process.exit
// abandons whatever has not drained — `context` was losing everything past roughly 8 KB to any
// caller that read it programmatically, silently and with exit 0. Setting the code and letting
// node leave on its own flushes first. Nothing here holds the event loop open.
if (isMain()) {
  const args = process.argv.slice(2)
  if (args[0] === 'help' || args.includes('--help') || args.includes('-h')) {
    console.log(usage())
  } else {
    process.exitCode = runTaskCommand(args)
  }
}
