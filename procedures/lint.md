---
type: Procedure
title: Lint a nytka project
description: Health-check a package for stale claims, broken decision graphs and dangling links
status: draft
generated: { by: claude-opus-5, at: 2026-07-27 }
---

# Procedure — lint

**Trigger:** session start, after any ingest, and before committing knowledge changes.

```bash
node nytka/tools/nytka-lint.mjs /path/to/project
node nytka/tools/nytka-lint.mjs . --json          # machine-readable
node nytka/tools/nytka-lint.mjs . --today=2027-01-01   # test future staleness
```

Exit code `1` if any error-level finding exists, `0` otherwise. Zero dependencies.

---

## What it checks

| Check | Level | Catches |
|---|---|---|
| `required-file` | error | missing `project.yaml` or `AGENTS.md` |
| `stale` | error | `stale_after` / `validUntil` in the past |
| `decision-graph` | error | `supersedes` with no matching `superseded_by`, or a dangling number |
| `dataset` | error | a dataset past `validUntil` still marked `current` |
| `missing-type` | error | a document outside the vocabulary |
| `missing-frontmatter` | warn | a document with no frontmatter block at all |
| `unverified` | warn | a `stated` fact or cited source with no `verified` entry |
| `decision-unconfirmed` | warn | a `stable` Decision no human has verified |
| `dangling-link` | warn | a relative link to a file that does not exist |
| `current-state` | warn | newest date in `current-state.md` older than 30 days |
| `unknown-status` / `unknown-confidence` | warn | value outside the enum |
| `unfilled-placeholder` | warn | an angle-bracket `<placeholder>` left in prose — scaffolded, never filled in |
| `template-comment` | warn | a `<!-- ... -->` template instruction left in prose — scaffolded, never written |
| `task-registry` | warn | `tasks.yaml` does not parse — the task commands cannot read it |
| `task-status-unknown` | warn | a task `status` outside SPEC §8, or missing |
| `task-blocked-consistency` | warn | `blocked` with nothing open, or open blockers under another status |
| `orphan` | info | nothing links to the document |
| `task-status-alias` | info | `todo`, which §8 reads as `ready` |

Unknown values are warnings, never errors — SPEC §13 forbids rejecting a package over
vocabulary it does not recognise.

The last four read `tasks.yaml`, and only when `project.yaml` declares `tracker: file`. On an
external tracker the registry here is a generated snapshot, so reporting it would blame this
repo for the tracker's state — rule 4 below.

`task-status-alias` is capped at `info` by §8 itself: `todo` is a documented alias, not a
defect. `task-blocked-consistency` is the one with a case for `error` eventually — a task
claiming `blocked` with nothing blocking it contradicts itself, which is what an error means —
but rule 3 governs entry, and its evidence so far is two catches in one registry, found by hand.
That is one source, not two.

Deliberately absent: the fields §8 requires to *enter* a state — `evidence` and
`completionSummary` at `done`, `acceptedBy` after `proposed`, `reason` at `cancelled`. Those
bind at the transition and are explicitly not retroactive, while lint sees only the state a task
is in now. Without a record of when a project adopted the lifecycle, such a check cannot tell a
task closed last year from one closed today, so it would fire on every correctly-closed task in
every existing registry — which §8 names as how a spec teaches people to ignore it.

Both are scoped to prose: angle brackets and comment markers inside a code span or fence are how
this repo and the templates document their own formats, and a check that flagged those would be
muted inside a week — a muted check still reads as coverage. `template-comment` used to read the
raw file instead, so any document explaining the check tripped it and the row above had to
describe the marker in words rather than show it; the two halves now share one stripped view of
the prose. Both report at `warn`, because a check earns `error` by having been right in practice
rather than by its author being confident — promoting them is
[TOOL-006](../tasks/tasks.yaml).

---

## What lint cannot check

It reads files. It does not know what is true.

`stale_after: 2027-01-01` on a document whose facts changed yesterday still passes. Lint
tells you a claim is *unverified or expired*, never that it is *wrong*.

For that, extend it per project: a CMS-backed project might query the CMS and compare
published-document counts against the snapshot in `current-state.md`. Such checks are
project-specific and belong in the project, not in nytka.

---

## Acting on findings

1. **Errors block.** Fix them, or record in `unresolved.md` why the project is choosing to
   carry one.
2. **`stale`** — re-verify against the live system, then update `stale_after` and add a
   `verified` entry. Do **not** just push the date forward; that converts a real signal into
   a lie.
3. **`unverified` on a Decision** — either get human confirmation or drop `status` to `draft`.
4. **`orphan`** — either link it from somewhere that matters, or delete it. Knowledge nothing
   references is knowledge nobody will find.
5. **`dangling-link`** — usually a file that moved. Sometimes a file that was never written,
   in which case the link is a to-do.

## Failure conditions

| Symptom | Meaning |
|---|---|
| Lint is clean but the project feels wrong | You are hitting its limit — it checks form, not truth. Verify against live systems. |
| The same `stale` finding recurs every month | The date is being bumped without re-verification. Bumping without checking is worse than an expired date. |
| Dozens of orphans | The package grew faster than anything referenced it. Prune. |

## Done when

Zero errors, and every remaining warning is either fixed or deliberately accepted with a
recorded reason.
