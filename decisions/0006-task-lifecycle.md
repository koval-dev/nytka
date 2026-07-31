---
type: Decision
title: Tasks have a named lifecycle, and no task leaves proposed without a human
status: stable
generated: { by: claude-opus-5, at: 2026-07-28 }
verified: [{ by: "human:mike", at: 2026-07-30 }]
confidence: stated
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

- **`ready` is canonical, and `todo` is a documented alias read as `ready`.** *This record
  drafted the opposite — `todo` dropped outright, as the one part of the change that was not
  purely additive — and was settled against its own draft on 2026-07-30. The reasoning is in
  Status below.* An alias is not "keeping both", which would guarantee inconsistent use: one
  spelling is what §8 names and what a checker nudges toward at `info`, the other is what §13
  already guarantees a consumer will not reject. Every existing `todo` stays conforming, and no
  registry in the line needs a pass.
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

**Confirmed by the owner on 2026-07-30, and in `SPEC.md` §8 the same day.** Both open points
were settled, one of them against this record's own draft. Confirming a draft is not the edit
P5 forbids — nothing accepted changed meaning, because nothing here had been accepted.

**`ready` is canonical; `todo` is a documented alias, not an error.** §8 names `ready`, and a
consumer reads `todo` as `ready` under §13's liberal conformance. Dropping `todo` was the
drafted position, and the counter-evidence is better than the argument for dropping it: a
task-management skill the owner wrote separately, for a different project, with no reference to
this spec — [github.com/koval-dev/claude-skills](https://github.com/koval-dev/claude-skills) —
converged on exactly `todo | in_progress | blocked | done`. Independent convergence is the
strongest evidence available that those four are a natural base set. Keeping `todo` conforming
preserves that evidence instead of overruling it, and §13 is the mechanism the format already
has for exactly this case. The alias costs one sentence in §8; dropping the word costs a pass
over every registry in the line on the day the rule is published. Lint nudges toward the
canonical spelling at **info** — that check is implementation work and ships from the tools
repo, which is why §8 describes the alias rather than leaving the check to assert it.

**`acceptedBy` gets its own field.** `verified` answers *who checked this claim?*; `acceptedBy`
answers *who committed to this work?* One field with two unrelated meanings is the cheaper
option only until something reads it, and something does: §5 derives trust tiers from
`verified`, so every task a human accepted would derive as **human-reviewed**, asserting a check
nobody performed.

Everything else stands as drafted. §8 states one thing this record left implicit — `cancelled`
is reachable from any open status, not only from `proposed` — and adds a rule this record needed
and did not have: the fields required at `done` bind at the transition, so tasks closed before a
project adopted the lifecycle stay conforming and are not backfilled. That is the same §13
reasoning as the alias, applied to fields instead of to a spelling.
