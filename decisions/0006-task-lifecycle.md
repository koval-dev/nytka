---
type: Decision
title: Tasks have a named lifecycle, and no task leaves proposed without a human
status: draft
generated: { by: claude-opus-5, at: 2026-07-28 }
confidence: inferred
supersedes: null
superseded_by: null
tags: [tasks, lifecycle]
---

# 0006 — Tasks have a named lifecycle, and no task leaves `proposed` without a human

## Decision

§8 names the statuses a task may hold, and what moves it between them:

| Status | Means | Leaves when |
|---|---|---|
| `proposed` | Someone thinks this should happen. No commitment. | a human gives it an owner → `ready`, or declines it → `cancelled` |
| `ready` | Owned and specified. Safe to start. | work begins → `in_progress` |
| `in_progress` | Being worked now. | a dependency stops it → `blocked`; work finishes → `review` |
| `blocked` | Cannot proceed. `blockedBy` is non-empty. | the dependency clears → back to `ready` or `in_progress` |
| `review` | Work finished, `acceptanceCriteria` not yet checked. | every criterion checked → `done`; any criterion failed → `in_progress` |
| `done` | Every criterion checked, with evidence. | never |
| `cancelled` | Will not be done. `reason` required. | never |

**The rule that carries the weight: a task may not leave `proposed` without a `human:` actor
recorded in `acceptedBy`.** Agents may create tasks freely and may move nothing out of
`proposed`.

New fields: `proposedBy` (actor, required at `proposed`), `acceptedBy` (actor, must be
`human:`, required to leave `proposed`), `reason` (required at `cancelled`),
`completionSummary` and `evidence` (required at `done`), `workLog` and `artifacts`
(optional, append-only).

All additive. §13 forbids a consumer rejecting unknown values, so every existing task stays
conforming.

## Reason

**§8 does not currently name a single status.** It requires a `status` field and never says
what may go in it. `tools/nytka-lint.mjs` validates `status` only on document frontmatter —
`draft | stable | deprecated | superseded` — and reads `tasks.yaml` not at all. So task status
today is unconstrained by the spec *and* unchecked by the linter. This record does not extend
a lifecycle; it writes the first one.

That gap already produced a real error. `kd-nytka/AGENTS.md` stated *"Statuses are `todo` /
`in_progress` / `blocked` / `done`, matching SPEC §8 as it stands today"* — citing §8 as the
source of four values §8 has never contained. A downstream package invented a vocabulary,
attributed it upstream, and nothing detected it. That is precisely the drift the format exists
to make visible, occurring inside the format's own line.

**An agent-invented task and a committed one must not look the same.** This is the same
principle §5 already applies to documents through the trust tiers: a claim with no `verified`
entry is *unverified*, and one with a `human:` verifier is *human-reviewed*. Tasks had no
equivalent, so an agent could append twenty plausible tasks to a registry and they would read
exactly like the ones the owner chose. `proposed` + `acceptedBy` gives tasks the tier
distinction documents already have — deliberately mirroring the existing rule rather than
inventing a second mechanism.

**Astro's RFC process is the model, and its lesson is about artifacts, not fields.** Stage 1
is a discussion, stage 2 an issue with a named champion, stage 3 a file in the repo. A
proposal changes *what it is* when it acquires an owner. The nytka equivalent of a champion is
the existing `owner` field, which is why `ready` requires one and `proposed` does not.

**`review` is the state that stops "done" from being self-assessed.** §8 already argues
`acceptanceCriteria` exists because otherwise "done" is a judgment call. Without a state
between finishing and closing, the person who did the work is also the one declaring it met —
which is the judgment call returning by a different route.

## Consequences

- **`todo` is dropped in favour of `ready`, and this is the one part that is not purely
  additive.** The two mean the same thing; keeping both guarantees inconsistent use, and seven
  statuses is already at the edge of what `AGENTS.md`'s *"can an agent follow it without
  tooling?"* test tolerates. Existing `todo` values stay conforming under §13 and should be
  read as `ready`. Every registry in the line needs a pass. **This is the open point on this
  record** — keeping `todo` and dropping `ready` is the coherent alternative.
- **Lint still checks none of this.** Task status is spec-level only; `nytka-lint` does not
  read `tasks.yaml`. Making the `proposed` rule enforceable is a separate change to the
  linter, weighed against 0003's zero-dependency constraint. Until then the rule is followed
  because it is written down, which is the same footing every other §8 rule stands on.
- **Agents get a place to put ideas without contaminating the plan.** The reason to add
  `proposed` rather than tell agents not to create tasks: they will surface real work, and the
  alternative is that it either gets lost or gets silently promoted.
- `cancelled` without `reason` is how a backlog forgets what it already rejected and proposes
  it again.
- Every mode in 0004 must carry these fields, including external trackers. A tracker with no
  equivalent of `proposed` maps it to its own backlog state; the mapping is per-project.

## Status

Draft, and not yet confirmed by the owner. Two things need a decision before this reaches
`SPEC.md`: the `todo` versus `ready` question above, and whether `acceptedBy` is worth a field
of its own rather than reusing `verified`.
