---
type: Decision
title: Five rules govern adding a lint check
status: stable
generated: { by: claude-opus-5, at: 2026-07-31 }
verified:
  - { by: claude-opus-5, at: 2026-07-31, against: lint-source }
  - { by: "human:mike", at: 2026-07-31 }
confidence: inferred
supersedes: null
superseded_by: null
tags: [lint, tooling]
---

# 0008 — Five rules govern adding a lint check

## Decision

A check is added to `nytka-lint` under the five rules below. **The numbers are part of the
decision.** Lint's source and two procedures in this repo already cite "rule 3" and "rule 4" by
number; until today those citations resolved to a task's `context` field, which is not a place
anyone reads and not a place that survives the task closing. Rules 1–4 keep the numbers they were
cited by. Rule 5 is new here.

### 1. A level is never a matter of taste

| Level | Means |
|---|---|
| `error` | the package contradicts itself, contradicts the calendar, or fails a SPEC §13 conformance requirement |
| `warn` | a human should look |
| `info` | FYI |

Two clauses the four-rule version left out. Both surfaced by writing it down rather than by
arguing about it.

**The conformance arm is real, and the rule as stated omitted it.** Lint errors on five checks.
`decision-graph` is the package contradicting itself; `stale` and `dataset` are the calendar. The
other two are neither: `required-file` and `missing-type` error because §13 says a conforming
package has `project.yaml`, `AGENTS.md` and a non-empty `type` on every document. Nothing
contradicts anything — the thing is simply absent. Rule 1 described three of the five error checks
and was applied for a week as though it described all of them.

**The clause being enforced sets the ceiling, and it can sit below what this table allows.** §8
caps `task-status-alias` at `info` in words: `todo` is a documented alias, not a defect, and no
checker may raise it higher — even though rule 1 on its own would happily call an inconsistent
spelling something a human should look at. §13 caps every unknown-vocabulary check below `error`,
because a conforming consumer must not reject a package over a value it does not recognise. Read
the clause you are enforcing before you pick a level. It may have picked one already.

This is a clause of rule 1 rather than a rule of its own on purpose. Rule 1 is the rule that
answers *what level?*; a second rule answering the same question is two writable statements of one
fact, and P2 says which way that goes.

### 2. Lint never requires configuration

A rule that needs configuring is a preference, and preferences belong in `AGENTS.md`, where a
human reads them and a diff shows them changing. A config file is how a linter becomes negotiable:
the check nobody wants gets switched off in the project that needed it most, and the file that did
it is not the file anyone reviews.

Reading `project.yaml` is not configuration — that is rule 4, and the two are easy to confuse. The
test: **would the field exist if lint did not?** `tasks.tracker` would; it is the project saying
what it is. A `lint.rc` would not; it is the project saying what it will tolerate being told.

### 3. A check enters at `info` or `warn`, and reaches `error` only once it has been right in practice

A check that errors wrongly on day one teaches people to ignore the tool, and that lesson is not
un-taught by fixing the check.

**"Right in practice" means all four of these, measured against the check as it stands on the day
of promotion — not against the version the evidence was collected with:**

1. **Two correct findings, from inputs that do not share an origin.** Independence is a property
   of where the input came from, not of how many files the check touched. Two packages scaffolded
   from one template are one observation wearing two hats. Two catches in one registry, found by
   hand, are one source. Count origins.
2. **At least one of them from somewhere nobody predicted** — a package or registry that did not
   prompt the check, and that whoever wrote the check does not maintain. A check confirmed only
   where it was aimed has been tested against its author's imagination, which is the thing the
   test was supposed to be independent of.
3. **No outstanding false positive**, and the count is zero rather than low. A false positive
   includes any document that reworded itself to get past the check: a finding that was fixed in
   the wrong file is still a finding the check got wrong, and it is the more dangerous kind,
   because the check now looks clean. If a class of false positive is known and unfixed, the check
   is not promotable however many true catches sit beside it.
4. **Nothing goes red unexamined.** Every existing `warn` that promotion would turn into an
   `error` is read first. A package that fails on the day a check is promoted must fail for a
   reason someone has named that day.

**A clean run is evidence for clause 3 and for nothing else.** A check that has never fired outside
its origin has one observation, however many packages it has run clean on.

**There is deliberately no time-in-service bar and no false-positive quota.** Both were considered
and neither is supported by anything that has happened here. The check that shipped wrong shipped
wrong on evidence quality, not on youth — it would have been just as wrong a month later with the
same two same-origin packages behind it, and a check run twice a year for a year still has two
observations. Elapsed time is easy to measure and measures nothing. As for a quota: clause 3 is
zero because the failure mode is muting, and a check with an accepted false-positive rate is a
check people learn to skim.

### 4. Lint reads what the project declares, and silently skips what does not apply

§4 offers `tracker: file | github-projects | linear | jira`. A check that assumes one of them is
noise on a project using another, and a linter that warns about a platform you do not use is a
linter people stop running.

The task-registry checks are the worked case: they open `tasks.yaml` only where `project.yaml`
declares `tracker: file`. On an external tracker the registry in the repo is a *generated*
snapshot, so reporting a finding against it would blame this repo for the tracker's state and
point the fix at a read-only file. No registry, or a tracker that is not `file`, and the checks are
skipped — not guessed at, and not warned about.

**Silently is the operative word.** A skip that announces itself is a finding about the project's
shape, which is rule 2 arriving through the back door.

### 5. A check must not fire on work that was correct when it was done

Lint sees the state a package is in now, never the transition that put it there. Where an
obligation binds at a transition, a check for it cannot tell work that predates the rule from work
that ignored it, so it fires on everything ever finished.

The worked case is a check that was deliberately not written. §8 requires `evidence` and
`completionSummary` to *enter* `done`, `acceptedBy` to leave `proposed`, and `reason` at
`cancelled`, and says in the same section that those fields bind at the transition and closed tasks
are never backfilled — `evidence` reconstructed from memory being the undated claim P4 exists to
reject. A required-field check would be correct by its own logic on every task it flagged: the
field really is missing. It would be wrong under §8 on every one of them. In this repo alone that
is all three closed tasks, each of which carries `evidence` and none of which carries
`completionSummary`; anywhere in the line that closed tasks before 2026-07-30, the count is larger.

So the check is not written. It becomes writable when a package can record *when it adopted a rule*,
and nothing in the format carries that today.

---

## Reason

**The rules existed and were unreachable, and that cost a demotion inside a day.** All four were
articulated in a working session on 2026-07-29 and written down in one place: the `context` field
of the task asking for them to be written down somewhere else. On 2026-07-30 a new check shipped at
`error`, which rule 3 forbids, and was demoted to `warn` the same day. Nobody adding it could have
read the rule it broke. That is the failure this record fixes, and it is worth stating plainly that
the fix is not a better rule — the rule was fine — it is a reachable one.

**Rules are copyable; a table of levels is not a reason.** `procedures/lint.md` lists every check
and its level. Someone adding a check reads that table and picks the level that looks like the
neighbours. Three checks were levelled in one week and no two of them for the same reason:

- `task-status-alias` is `info` because §8 says that level, in words.
- `task-status-unknown` is `warn` and can never be `error`, because §13 forbids a consumer
  rejecting a package over an unknown value. The ceiling came from the clause being enforced, not
  from the check.
- `task-blocked-consistency` is `warn` on rule 3 alone. Rule 1 would allow `error` eventually — a
  task claiming `blocked` with nothing open contradicts itself, which is exactly what an error
  means — but its evidence is two catches in one registry, found by hand, which is one source.

Three levels, three different authorities, and the table shows one column. That is what makes the
table copyable and the reasoning not.

**Rule 3 was the one with teeth and the one with no definition.** "Right in practice" was never
defined, and the first check to reach for it produced the exact ambiguity: it was right on two
packages, both scaffolded from one template. Two right answers, one observation. The definition
above exists so that the next person does not have to re-derive that, and clause 1 is written as
*origin* rather than *count* because counting is what went wrong.

**Clause 3 is zero because muting is the failure that actually happened here.** One half of that
same check tested raw file text while the other stripped code spans and fences first, on the
reasoning that the templates document their own formats with angle brackets and those lines must
survive forever. The consequence was that every document explaining the check tripped it —
including this repo's own lint procedure, which had to describe a marker in words instead of showing
it. A row of documentation was degraded to keep a check quiet. That is the shape clause 3 is aimed
at: the finding was real by the check's own logic, the fix went into the wrong file, and afterwards
the check read as coverage. It was fixed upstream the next day; the rule is what remains.

**And the same check still has a live false-positive class, which is why clause 3 says "as it
stands".** Markdown allows a code span to wrap across a newline; the code-stripping regex excludes
newlines, so a wrapped span survives stripping and its contents are read as prose. A command
example wrapped mid-span reports a placeholder that is not one. Reproducible in three lines against
the vendored source. Evidence collected before that is evidence about a different check.

**Rule 5 is not a restatement of rule 3.** Rule 3 is about a check being *correct*; rule 5 is about
a check being *retroactive*. The required-field check is the case that separates them: it would
have been correct every single time it fired, on evidence nobody could dispute, and it must still
not be written. §8 makes the point in its own voice — a rule that makes every existing registry
non-conforming on the day it is published is how a spec teaches people to ignore it.

**Why the list stops at five.** Two candidates were weighed and one was folded in rather than
added. The ceiling — that the clause being enforced can cap a check below what rule 1 allows — is a
clause of rule 1, because rule 1 is the rule that answers *what level?* and two rules answering one
question is P2. The other candidate was a time-in-service bar for rule 3, rejected above for having
no evidence behind it. Nothing else in three days of checks needed a rule that these five do not
give. Four load-bearing rules beat seven with three of them filler, and a rule with no failure
behind it is exactly what `unresolved.md` refuses for frontmatter fields.

## Where this contradicts something already written

**§8 cites §10 for a procedure §10 does not state.** §8 says a checker that learns its rules
"introduces them the way §10 describes, at `info` or `warn`, promoted only after being right in
practice." §10 said no such thing in general. It said it about one check — the placeholder check
reports at `warn` "because a check earns `error` by having been right in practice rather than by
its author being confident" — and never that a check *enters* below `error`. The citation was
reaching for a general rule from a sentence about a single case.

This is the same shape as the miscitation [0006](0006-task-lifecycle.md) was written to fix, where
a downstream file cited §8 for a vocabulary §8 had never carried, and it is inside the spec this
time rather than downstream of it. **§10 is amended to state the rule generally**, which makes §8's
existing citation true. That is a one-sentence generalisation of something §10 already implied, not
a new normative claim, and it stays inside SPEC.md rather than linking out — [0001](0001-spec-is-one-file.md)
is why SPEC.md has no outbound links at all.

**`procedures/lint.md` cited "rule 4 below" with no rule 4 below it**, and `procedures/init-project.md`
linked "rule 3" to the task registry. Both now resolve here.

## Status

**These four were inferred from practice, not legislated, and this record does not pretend
otherwise.** They were stated once in a session, applied by the people who stated them, and never
read by anyone else. Recording them does not make them more agreed than they were — it makes them
checkable, which is the prerequisite for disagreeing with them.

**Confirmed by the owner on 2026-07-31**, closing TOOL-002. The parts written here for the first
time are rule 3's four clauses, rule 5, and the conformance arm of rule 1; the last is a correction
to how the rule was stated rather than to how the code behaves, and the code was right.

Rule 3's strictness was put to the owner as the thing most likely to be wrong, with the looser
alternative named — one correct finding plus no outstanding false positive, dropping the
independent-origin clause. That is the bar which let a check ship at `error` and be demoted the
same day, and the strict version was accepted as a standing rule rather than a one-off. The
expected cost is checks sitting at `warn` longer than feels comfortable; if that turns out to be
the wrong trade, it is a supersede, not an edit.

**On immutability.** P5 and §6 make a decision immutable once `stable`, and the natural objection
is that a promotion bar will keep moving. It should not, and the record is shaped so that it does
not have to: the **rules** live here, the **evidence** lives in `procedures/lint.md` and the task
registry. A check being promoted changes a row in a table, not this file. If a clause of rule 3
turns out to be wrong, that is a supersede, which is P5 working rather than P5 getting in the way.

## Consequences

- **`procedures/lint.md` stops being the only home for lint's reasoning.** The table stays there
  and now says what it is: a record of decisions, with the rules that produced them one link away.
- **A check that cannot clear rule 3 is not blocked on a task, and §8 cannot say so.** The
  promotion of the placeholder check waits on a catch from a package nobody has scaffolded yet.
  `blockedBy` names tasks, so a task waiting on an event in the world has nothing to put in it, and
  a `blocked` status with an empty `blockedBy` falls out of both panes of `nytka status`. The
  current answer is that such a task keeps a `blockedBy` pointing at whatever last constrained it
  and says the rest in `workLog`. That is a workaround, not a shape the format has.
- **Rule 5 leaves a check un-writable rather than un-written.** The required-field checks become
  possible the day a package can say when it adopted a rule. That is a format question, not a lint
  question, and it is not opened here.
- **Lint's source cites these rules by number from another repo.** The comments in `@nytka/cli`'s
  lint source reference "rule 3" and "rule 4" by way of the task that held them; they should point
  at this record instead. That edit belongs where that source is writable, not here.
- **Nothing about the format changes.** No frontmatter field, no directory, no conformance rule.
  This record governs a tool nytka ships, and a project that runs no linter at all is unaffected.
