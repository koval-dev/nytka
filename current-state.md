---
type: State
title: Current state
description: What is happening on nytka right now
status: draft
generated: { by: claude-opus-5, at: 2026-07-29 }
verified:
  - { by: claude-opus-5, at: 2026-07-29, against: npm-registry }
  - { by: claude-opus-5, at: 2026-07-29, against: kd-nytka-working-tree }
  - { by: claude-opus-5, at: 2026-07-30, against: github-api }
  - { by: claude-opus-5, at: 2026-07-30, against: kd-nytka-working-tree }
  - { by: claude-opus-5, at: 2026-07-30, against: npm-registry }
  - { by: claude-opus-5, at: 2026-07-31, against: task-management-skill-schema }
  - { by: claude-opus-5, at: 2026-07-31, against: lint-source }
  - { by: claude-opus-5, at: 2026-07-31, against: nytka-working-tree }
confidence: inferred
---

# Current state

**Last updated:** 2026-07-31

## Current focus

v0.1 exists and is in use on one real project. The next thing that matters is still finding a
second **adopter** with a different shape.

What changed on 2026-07-29 is not an adopter but a **second lane**. Eight `@nytka/*` packages
are published, including a CLI, so the format can now be used by installing something as well
as by reading this repo. The owner stated the rule that separates the two — *installable ships
from the development repo, referenced-with-no-installation stays here* — and it immediately
decided where lint's source lives. Both lanes run the same conformance code.

## Active work

- **The daily loop is written** — [work-a-task.md](procedures/work-a-task.md), 2026-07-31, in
  `review`. Ten steps from reading the state to handing work back, every one a file edit with the
  commands shown only as accelerators. Its three additions to the loop as previously described are
  the ones with scars behind them: check a task's context is still true *before* working from it,
  verify against the thing rather than a report of it, and hand back to `review` rather than
  closing your own work.
- **PROC-001** — the procedure for when an agent may spend a human's attention,
  [ask-the-owner](procedures/ask-the-owner.md). Written 2026-07-31 and in `review`. It is the
  first procedure here about the format's *users* rather than its files, and it exists because
  the owner said the output had stopped being for humans. It gained a step on **reporting** the
  same day, after the session that wrote it broke it in the next message — it governed questions
  and said nothing about status reports, which are most of what an owner reads.
- **ADOPT-001** — still the thing that matters most, and still `in_progress`. A second adopter
  with a different shape is what would tell us which parts of v0.1 generalise. It now also gates
  **TOOL-006**, because promoting the placeholder check would turn two live adoptions red on
  findings nobody has answered.
- **TOOL-001** — `ready`, low: a worked project-specific lint check in the docs.

**A deliberate slowdown on format work, 2026-07-31.** The owner's read, and it is the right one:
33 commits in five days, almost all of them the format thinking about itself. SPEC.md is 560
lines and the repo around it was 4,000. The next thing that tells us anything about v0.1 is a
second adopter using it, not another decision record — so **the spec is frozen at v0.1**, and
edits to SPEC/`decisions/`/`unresolved.md` wait for a real project to break against them.

**Closed 2026-07-31 by the owner:** **SPEC-002** (the task lifecycle in §8), **TOOL-002** (the
rules for adding a lint check), and **SPEC-003** (what `artifacts/` is —
[0010](decisions/0010-artifacts-holds-non-markdown-files.md), closed on three of four criteria
with the fourth relocated, not descoped). [0006](decisions/0006-task-lifecycle.md),
[0007](decisions/0007-execution-fields-stay-out-of-the-task-record.md),
[0008](decisions/0008-lint-check-rules.md) and 0010 are all `stable`.

## Recent meaningful changes

Newest first, and short by rule. Full write-ups, including the 18 older entries pruned from
here on 2026-07-31, are in [history/timeline.md](history/timeline.md).

- **2026-07-31** — **`artifacts/` is defined in SPEC §3**
  ([0010](decisions/0010-artifacts-holds-non-markdown-files.md)). Non-markdown files the project
  owns, input or output; `artifacts/index.json` carries provenance; a file with no entry is legal
  and reads as unknown. Three `unresolved.md` entries closed on evidence already collected —
  and `current-state.md` was pruned into `history/` the same day, which the format has required
  since `ingest` step 5 and this repo had never done.

- **2026-07-31** — **the format gained a procedure for interrupting a human**,
  [ask-the-owner](procedures/ask-the-owner.md). A question must rebuild its own context in one
  sentence and arrive before the work; the three points where a human is structurally required
  are the filter. Used the hour it was written, and it closed two tasks.

- **2026-07-31** — **the rules for adding a lint check became
  [0008](decisions/0008-lint-check-rules.md)**, out of the task `context` field where they had
  been the whole time. Rule 3 gained a definition, a fifth rule was added, and the first thing
  the bar did was disqualify the check it was written for.

- **2026-07-31** — **six borrowed execution fields were weighed for §8 and all six rejected**
  ([0007](decisions/0007-execution-fields-stay-out-of-the-task-record.md)). Then the record was
  re-checked against the schema and four of its own claims were wrong; the conclusions held.

- **2026-07-30** — **§8 names a task lifecycle**
  ([0006](decisions/0006-task-lifecycle.md)). `ready` is canonical, `todo` is a documented
  alias, and the required fields bind at the transition so existing registries stay conforming.


## Blockers

None.

## Waiting

- **A second adopter with a different shape.** Everything in v0.1 still derives from one
  project — content/CMS work with a non-technical approver. Which parts generalise and which
  are merely shaped by that one case is currently indistinguishable. Six published connectors
  now write real payloads into `datasets/`, which is the first sustained outside exercise of
  that part of the format — but a connector is tooling, not an adopting project. Agent-reported
  numbers are still untested, and the wait continues. `artifacts/` came off this list on
  2026-07-30 when it started carrying real assets, and was specified on 2026-07-31
  ([0010](decisions/0010-artifacts-holds-non-markdown-files.md)).

## Verified snapshots

| Claim | Value | Verified | Against |
|---|---|---|---|
| Repo is public and the raw SPEC.md URL resolves | yes | 2026-07-30 | `gh repo view` + `curl` → 200 |
| Brand assets here match the hub byte for byte | yes, all 4 registered — the logomark under a corrected filename | 2026-07-30 | md5 across both working trees |
| Lint reads `tasks/tasks.yaml` | **yes, since 2026-07-31** — form only: the `todo` alias at `info`, a status outside §8 at `warn`, and whether `blocked` and an unresolved `blockedBy` agree | 2026-07-31 | source — `TASK_STATUS_ALIASES` and three `task-status-*` checks |
| Adopters in production | 1 project + 1 tooling line (8 published packages) | 2026-07-29 | npm registry |
| Lint runs clean on itself | yes — 0 errors, 0 warnings, 0 info, 21 documents | 2026-07-31 | `node tools/nytka-lint.mjs .` |
| Both backlogs parse whole | yes — 10 of 10 here, 47 of 47 in the tools repo, counts matched against the raw entries rather than trusted | 2026-07-31 | `node tools/nytka.mjs status` in each |
| A code span wrapped across a newline is read as prose by `unfilled-placeholder` | yes — the span pattern excludes newlines, so the span survives stripping and its contents report | 2026-07-31 | `tools/nytka-lint.mjs`, reproduced against the vendored regex |
| The task-management skill's status enum is `todo\|in_progress\|blocked\|done` | yes — the convergence §8 cites is now first-hand, read from the schema rather than from a note | 2026-07-31 | local plugin checkout, commit `4c8eb6b`, fetched 2026-07-27 |
| A freshly scaffolded package reports its own blanks | yes — 0 errors, 7 warnings | 2026-07-30 | `nytka init` into a temp dir |
| Lint dependencies | 0 | 2026-07-27 | source |
| `tools/` is four generated copies | yes — lint and the task commands both regenerated 2026-07-30. `tools/` was ahead of published 0.3.1 until 0.4.0/0.4.1 shipped the same day | 2026-07-30 | file headers + the source repo's drift check |
| `npx @nytka/cli lint` runs the same checks | **not today** — 7 warnings here against 1 from 0.3.1, same directory | 2026-07-30 | both run against a fresh `init` scaffold |
| The task commands answer `--json` | yes in `tools/`; published 0.3.1 rejects the flag on five of them | 2026-07-30 | both run against this repo |
| Published connectors | 6 (`gsc` 0.3.3, `ga4` 0.2.3, `sanity` 0.3.2, `gtm` 0.1.2, `dataforseo` 0.1.3, `ads` 0.1.1) | 2026-07-29 | npm registry |
| Published runtime | `@nytka/cli` **0.4.1** — 0.4.0 shipped 2026-07-30 and 0.4.1 the same day; `@nytka/core` 0.1.0 as of 2026-07-29, not re-checked | 2026-07-30 | `npm view @nytka/cli version` |
| ~~What installing 0.3.1 still gets you~~ | superseded — 0.3.1 and 0.4.0 both scaffold without `private/`, by two different mechanisms; 0.4.1 is the first release whose template tree is complete | 2026-07-30 | `npm pack @nytka/cli@0.4.1` and read it |
| A connector has run against a live external system | yes, for five of six | 2026-07-29 | development repo's `current-state.md` |

## Next deadline

None. Nytka is a tool for other work, not a deliverable.
