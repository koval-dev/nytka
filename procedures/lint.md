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
| `orphan` | info | nothing links to the document |

Unknown values are warnings, never errors — SPEC §13 forbids rejecting a package over
vocabulary it does not recognise.

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
