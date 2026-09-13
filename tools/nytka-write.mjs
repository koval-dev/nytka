// ---------------------------------------------------------------------------------------
// GENERATED FILE — DO NOT EDIT.
//
// Source:      @nytka/cli/src/write.mjs
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
// The one safe writer in the line. Every module here that replaces a file on disk goes through
// it, and none of them may write a file in place again.
//
// Extracted from tasks.mjs on 2026-09-13, the same day the code was written, when the second
// consumer appeared: `add` writes `.env.example` and `upgrade` writes `package.json`, and both
// did it with a bare writeFileSync. One copy of a primitive with three callers, rather than the
// two copies that would otherwise have been correct separately and drifted apart — which is what
// happened to the YAML parser before 0010, and is the reason that decision reads the way it does.
//
// Same two rules as lint.mjs and tasks.mjs, and for the same reason — this file is vendored into
// ../nytka/tools/ and runs there under bare node in a repo with no node_modules:
//   1. Import nothing but `node:` builtins and sibling modules by relative path.
//   2. Keep exports free of argv and process.exit. Nothing here prints; a caller that wants a
//      message passes a callback and decides what to do with it.

import { readFileSync, statSync, openSync, writeSync, fsyncSync, closeSync, renameSync, rmSync } from 'node:fs'
import { join, dirname, basename } from 'node:path'

// ------------------------------------------------------------------ why this exists
//
// Five commands edit a hand-maintained YAML file in place. Until 2026-09-13 each of them did it
// with a bare writeFileSync and no lock, and two failures followed from that — one measured, one
// by inspection:
//
//   1. Two `task start` calls on DIFFERENT tasks, started at the same moment, lost a transition
//      in 39 of 40 runs. In 32 of those the registry ended up recording NEITHER, while one of
//      the two commands had printed its success line and exited 0.
//
//      verifyWrite detected the clash every time — detection was never the missing half. The
//      damage was its RECOVERY: it restored a pre-image captured before the other process's
//      write landed, so the loser's rollback reverted a transition the winner had already
//      reported as done. Wrong, believable and exit 0, which is this file's recurring failure.
//
//   2. writeFileSync is not atomic, and neither was that rollback. A crash, a full disk or a
//      kill between the open and the last byte truncates the registry, and the only copy of the
//      pre-image is in the dead process's memory. That one needs no second agent, and it is the
//      reason this is not filed as a concurrency feature: one agent can lose the backlog.
//
// Both are fixed by two primitives below, and neither costs a dependency — `node:fs` has had
// what was needed all along. The lock is held across the whole read-splice-write-verify cycle,
// so the pre-image verifyWrite would restore is guaranteed to still be the current file.
//
// Measured on one machine on 2026-09-13 with the harness that is now the regression test in
// test/tasks.test.mjs. The counts are a dated observation, not a constant: the interleaving
// depends on the filesystem and the load. What does not vary is that the window exists.

const LOCK_STALE_MS = 30_000
const LOCK_WAIT_MS = 10_000
const LOCK_POLL_MS = 25

/**
 * Block for `ms` without going async and without a dependency.
 *
 * Every write path here is synchronous — runTaskCommand returns an exit code, it does not
 * return a promise — so waiting for a lock cannot be done with a timer. Atomics.wait on a
 * SharedArrayBuffer nobody else holds is the sanctioned way to sleep on the main thread; the
 * fallback spins, which is worse but still bounded, and only runs where SharedArrayBuffer has
 * been disabled.
 */
function sleepSync (ms) {
  try { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms); return } catch { /* below */ }
  const until = Date.now() + ms
  while (Date.now() < until) { /* spin */ }
}

/** The pid that holds a lock file, so the message names something a human can look up. */
function lockHolder (lock) {
  try { return readFileSync(lock, 'utf8').trim().split(/\s+/)[0] || 'unknown' } catch { return 'unknown' }
}

/**
 * Replace `file` with `text` so that no reader can ever see a half-written registry.
 *
 * Write a sibling temp file, flush it to disk, then rename over the target. rename is atomic on
 * POSIX and replaces on Windows, so a concurrent reader — `nytka status`, lint, a text editor,
 * git — sees either every old byte or every new one. The temp file is named `.<file>.<pid>.tmp`
 * so two processes cannot pick the same name, and `.tmp` keeps it out of lint, which treats
 * only `.md` files as documents.
 *
 * fsync before the rename rather than after: the point is that the bytes are durable before
 * anything points at them. A crash then leaves the old registry intact and a stray temp file,
 * which is the failure mode worth having.
 */
export function writeFileAtomic (file, text) {
  const tmp = join(dirname(file), `.${basename(file)}.${process.pid}.tmp`)
  let mode
  try { mode = statSync(file).mode & 0o777 } catch { /* a file that does not exist yet */ }
  try {
    let fd
    try {
      fd = openSync(tmp, 'w', mode ?? 0o666)
      writeSync(fd, text)
      fsyncSync(fd)
    } finally { if (fd !== undefined) closeSync(fd) }

    // EPERM/EBUSY/EACCES on rename is Windows with a virus scanner or an editor holding the
    // destination open. It clears in milliseconds, and losing the edit over it would be worse
    // than waiting for it.
    for (let attempt = 0; ; attempt++) {
      try { renameSync(tmp, file); return } catch (err) {
        if (attempt >= 20 || !['EPERM', 'EBUSY', 'EACCES'].includes(err.code)) throw err
        sleepSync(LOCK_POLL_MS)
      }
    }
  } catch (err) {
    rmSync(tmp, { force: true })
    throw err
  }
}

/**
 * Run `fn` holding an exclusive lock on `file`, and release it however `fn` ends.
 *
 * `openSync(lock, 'wx')` is O_CREAT|O_EXCL — the kernel either creates the file or fails, with
 * no window between the two, which is the whole reason a lock can be built out of it. A
 * directory would work equally well; a file is used because lint walks directories and there is
 * nothing to be gained by giving it one more to descend into.
 *
 * A lock older than `staleMs` is broken. That is a deliberate trade, not an oversight: a holder
 * killed between creating the lock and releasing it would otherwise stop every task command in
 * the project until somebody deleted a file they had never heard of. The threshold is three
 * orders of magnitude longer than a splice takes, so breaking one means the holder is gone or
 * hung. Refreshing the lock while `fn` runs would remove even that risk and needs a timer, which
 * a synchronous cycle has no way to service — worth revisiting only if a write ever gets slow.
 *
 * Not safe across machines: O_EXCL over NFS is unreliable and mtime is not comparable between
 * hosts. One filesystem, many processes, which is what a registry in a working tree is.
 */
export function withRegistryLock (file, fn, { staleMs = LOCK_STALE_MS, waitMs = LOCK_WAIT_MS, label, onStale } = {}) {
  const lock = join(dirname(file), `.${basename(file)}.lock`)
  const name = label ?? basename(file)
  const deadline = Date.now() + waitMs
  let fd

  for (;;) {
    try { fd = openSync(lock, 'wx'); break } catch (err) {
      if (err.code !== 'EEXIST') throw err

      let age
      // Released between the failed open and this stat — try again immediately.
      try { age = Date.now() - statSync(lock).mtimeMs } catch { continue }

      if (age > staleMs) {
        onStale?.(lock, age, lockHolder(lock))
        rmSync(lock, { force: true })
        continue
      }
      if (Date.now() >= deadline) {
        throw new Error([
          `${name} is locked by another nytka process — nothing was written.`,
          `  holder: pid ${lockHolder(lock)}, held for ${Math.round(age / 1000)}s`,
          `  waited ${Math.round(waitMs / 1000)}s. It should clear on its own; if it does not, delete ${lock}`,
        ].join('\n'))
      }
      sleepSync(LOCK_POLL_MS)
    }
  }

  try {
    try { writeSync(fd, `${process.pid} ${new Date().toISOString()}\n`) } catch { /* the lock is the file's existence, not its contents */ }
    return fn()
  } finally {
    try { closeSync(fd) } catch { /* already closed */ }
    rmSync(lock, { force: true })
  }
}
