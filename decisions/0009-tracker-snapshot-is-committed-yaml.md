---
type: Decision
title: A tracker snapshot is committed YAML, and the line may ship one generator
description: What §4's snapshot field names, and the one consequence of 0004 that no longer holds
status: draft
generated: { by: claude-opus-5, at: 2026-07-31 }
verified:
  - { by: claude-opus-5, at: 2026-07-31, against: nytka-cli-task-commands-and-lint }
confidence: stated
stale_after: 2027-01-31
supersedes: null
superseded_by: null
tags: [tasks, tracker, snapshot]
---

# 0009 — A tracker snapshot is committed YAML, and the line may ship one generator

## Decision

Two changes to §4, and one correction to a consequence of
[0004](0004-no-mandated-tracker.md).

**1. The snapshot is `tasks/snapshot.yaml`, not `tasks/snapshot.md`.** §4 line 141 names a
markdown file. Nothing in the line can read markdown as tasks — `nytka status`, `next`, `task`
and `context` parse YAML, and so does lint. The format's own example named a file its own
tooling cannot open.

**2. The snapshot is committed, not gitignored.** §4's comment says gitignored. That prevents
the snapshot reaching a second machine or surviving a clone, which is the entire reason §8 gives
for having one: *"so agents get cheap offline context."* A gitignored snapshot delivers cheap
offline context to exactly one working copy.

Everything else about it is unchanged and was already right: generated, read-only, synced
tracker → file only, never the reverse.

**3. 0004's consequence *"a snapshot generator is per-project"* no longer holds.** Its decision —
nytka mandates no tracker, and the real invariant is one writable source per fact — stands
untouched and is what makes this record conform rather than contradict.

## Reason

**Both §4 defects predate the use case that exposed them.** Line 141 was written on 2026-07-27 as
an illustrative block, when no tracker mode had ever been run and the task commands did not exist.
Neither is a design that turned out wrong; both are an example nobody had executed. That is worth
recording because it is the third time in this repo a line has been correct-looking and unrunnable,
and the pattern is always the same — a worked example that was never worked.

**The gitignored default answers a question nobody was asking.** Not committing derived data is a
good default, and P1 is right that git is bad at churn. But the snapshot is not ordinary derived
data: it is the thing an agent reads when it has no token, no network and a fresh clone, which is
the case the whole format exists to serve. Trading that for a clean `git log` is trading the goal
for a property of the repository.

The churn is real and is paid deliberately. It is bounded by sorting on id rather than the
tracker's return order, and by rewriting only when content changes.

**P2 already permits a committed generated view, and this line has shipped two.**
`tools/nytka-lint.mjs` in this repo is a committed, generated, read-only copy of a source that
lives in the development repo, carrying a banner that says so and a drift test that enforces it.
Brand assets are the same shape running the other way. The snapshot is the third instance of a
pattern already load-bearing here, which is the strongest evidence available that it works — a new
subject, not a new mechanism.

(Both of those are recorded in the development repo's own decision series, which numbers
independently of this one. This record is 0009 here; that repo's 0009 is about lint's source. Same
number, different repos, no relation — worth stating once because the coincidence is confusing and
neither can link to the other's number without saying which repo.)

**On 0004's second consequence.** *"Nytka ships no tracker integration"* is still true of this
repo and must stay true — no packages here, ever. What has changed is that the line acquired a
repo that does ship packages and six connectors proving the fetch → normalise → write shape
generalises. A per-project generator, written once per project, drifts immediately and never
becomes a thing anyone maintains.

**This record does not mark 0004 superseded, and that is a deliberate refusal.** 0004's decision
is correct, binding, and the reason this design is shaped the way it is. Marking it `superseded`
would tell every future reader to stop following a rule we are in fact following. The format has
whole-record superseding and nothing narrower, so there is no honest way to express *"one
consequence of this is out of date"* in the frontmatter — which is a gap in the format, recorded
in `unresolved.md` rather than worked around here.

## Consequences

- **§4's example block changes on two lines**, and only once this record is confirmed. A task
  carries that edit; writing it while this is `draft` is the sequence SPEC-002 already established
  and is the reason §8 was correct when it landed.
- **`storage: registry | files` is untouched**, and so is `registry:`. A project on an external
  tracker may carry both keys: `registry` is where a `file` project writes, `snapshot` is where a
  tracker project reads. They are never both authoritative, and `tracker:` is the field that says
  which.
- **A committed snapshot needs a banner**, for the same reason the vendored tools have one. A
  generated file that looks authored is how someone edits it, and an edit to a snapshot is a
  second writable copy of the tracker's state — P2's named failure, arriving through the file this
  record just asked every project to commit.
- **Reading a stale snapshot is now possible in a way it was not before.** Gitignored, a missing
  snapshot was obvious. Committed, a three-week-old one looks exactly like a fresh one. `collectedAt`
  in the file and a staleness warning in `nytka status` are what make that visible, using the
  machinery `current-state.md` already has.
- **0004 gains no `superseded_by` and no edit.** Anyone reading it gets a consequence that is out
  of date with nothing in the file to say so. This record is the only link, and it points backwards
  only — stated plainly because the alternative is pretending the format handled it.
- **Nothing changes for a project on `tracker: file`.** No new required key, no new file, no
  migration. That is the same guarantee `@nytka/cli` 0.4.2 enforces in code.

## Status

Draft. The committed-snapshot choice is the owner's, stated 2026-07-31 against an option that
named what gitignoring costs. The `.yaml` correction, the reading of 0004, and the refusal to mark
0004 superseded follow from evidence rather than from anything the owner said, and are this
record's to defend.

The design this serves is recorded in the development repo, which is where the tracker is built and
where a choice constraining more than one repo belongs. This record is only the format's half:
what §4 names, and which of 0004's sentences survived.
