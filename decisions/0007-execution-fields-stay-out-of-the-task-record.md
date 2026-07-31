---
type: Decision
title: Execution fields stay out of the task record
status: draft
generated: { by: claude-opus-5, at: 2026-07-31 }
verified:
  - { by: claude-opus-5, at: 2026-07-31, against: task-management-skill-schema }
confidence: inferred
stale_after: 2027-01-31
supersedes: null
superseded_by: null
sources:
  - { id: task-management-skill, resource: https://github.com/koval-dev/claude-skills, last_modified: 2026-07-27 }
tags: [tasks, vocabulary]
---

# 0007 — Execution fields stay out of the task record

## Decision

Six fields carried by an independently written task-management skill were weighed for SPEC §8.
**All six are rejected.** §8's minimum task fields are unchanged, and nothing in this record is
additive to the format.

| Field | Verdict |
|---|---|
| `complexity` | rejected — an unexplained integer computed from a taxonomy §8 does not have |
| `executionMode` | rejected — the lifecycle already answers it, and the field's own default contradicts it |
| `guardrails` | rejected **as a task field** — the failure it names is real, and §11 and §6 are already its home |
| `validationCommands` | rejected — a second writable copy of a criterion's check |
| `requiredContext` | rejected — a second writable copy of what a task already links |
| `acceptanceCriteria[].verification.command` | rejected **as a requirement** — most real criteria cannot carry one, and nytka has nothing to run it |

This record exists because [0006](0006-task-lifecycle.md) is `stable` and P5 forbids editing an
accepted decision to change its meaning. The rejections belong beside it, not inside it.

## What was actually read, and one correction

The brief for this evaluation stated that the skill was **not installed on this machine** and
that the work should proceed from a secondhand summary of it. That was wrong, and checking it
rather than accepting it is the only reason this record says what it says.

The skill is installed. It was read directly:

| | |
|---|---|
| Source | `github.com/koval-dev/claude-skills`, the repo [0006](0006-task-lifecycle.md) already cites |
| Pin | plugin `task-management` 1.0.0, commit `4c8eb6b` |
| Fetched | 2026-07-27, and **not re-fetched since** |
| Files read | the schema, the two skill files, the enrichment guide, and four worked examples |

**That pin is the honest caveat, and it is the only one.** The checkout is a snapshot taken on
2026-07-27; upstream may have moved and nothing here would notice. This is a dated observation
under P4, not a claim about the skill as it stands today.

Writing *"a file I could not open"* into this repo would have been the failure the format exists
to flag, manufactured on purpose — an unverifiable assertion, in a public file, about a source
the writer had in fact read. **The premise of a task is evidence like any other, and P3 applies
to it: check it before acting on it.**

**This record's own claims were then re-checked against the schema on 2026-07-31, and four were
wrong.** They are corrected above and below: the complexity rubric has three context regexes and
not two, and one of its seven factors (`hasBlockers`) keys on `blockedBy`, which nytka *does*
have — so "every factor" was an overstatement; `requiredContext`'s resolvable-path share was
stated as "roughly half" and is two entries in twelve; and the validator's defaults are written by
an opt-in `--fix` mode rather than arriving on every run. Three of the four had made the argument
sound stronger than the evidence supports. A record that rejects six fields for being unverifiable
has to survive the check it applies, so the numbers here are the counted ones.

Three things the secondhand summary omitted changed the analysis, and each is load-bearing below:

1. A **seventh** execution field, `executionSteps`, plus `subtasks`. A summary of six was a
   summary of a set that has more than six in it.
2. `verification` carries **`expected`** — *"what pass looks like"* — and its `type` enum
   includes **`manual`**. A command without an expected result is not a check, and the schema
   that introduces runnable verification already concedes most criteria will not have one.
3. The skill's validator has a `--fix` mode that **writes defaults into any task missing them** —
   `complexity: 5`, `executionMode: autonomous`, and empty arrays for the rest. It is opt-in, not
   the default `validate` run; the point below depends on it having been run, not on it running
   silently.

## Reason

The bar is `unresolved.md`'s, and it is deliberately hard to clear: *"Every field is justified by
a failure that actually happened on a real project… The cost is paid on every file; the benefit
arrives months later,"* with the working rule *"anything beyond that must earn its place with a
named failure."* A good idea is not a failure. Six good ideas are not six failures.

**A field whose tooling fills it in is a field nobody filled in.** The same entry's decision
trigger is *"count how many fields were actually filled in without prompting; drop the ones that
were not."* `complexity: 5` and `executionMode: autonomous` are exactly what `--fix` writes, so
once anyone has run it that count can no longer be taken — the field is present on every task and
nothing records whether its author chose the value or the tool supplied it. Three of the six can
defeat their own admission test with one command.

### `complexity` — rejected

The number is not portable, and the schema says so in its own rubric. Six of its seven factors key
on something nytka has refused or cannot port: an `owner` enum of five job titles, a `target`
naming one project's two websites, three regular expressions matching English against Ukrainian
keywords, and a cross-locale condition naming a different pair again (uk/ru). The sole exception
is `hasBlockers`, which keys on `blockedBy` — a field nytka does have, and the one factor that
would survive the move. That taxonomy was ruled out before this evaluation began, and correctly.
Import the number without its rubric and it is an integer nobody can re-derive; import the rubric
and the taxonomy arrives through the back door.

It is also redundant with the field beside it. Across the four worked examples the two move
together — the low scores are `autonomous`, the high ones `human-only` — and the skill's own
routing table collapses its top band to *"human-led"*, which is `executionMode` restated as a
number. Two fields, one fact, which is P2.

And a bare integer is the most authoritative-looking thing that can be written in a task record.
It has no `by`, no `at`, and no rubric travelling with it. §5's entire apparatus exists so that a
generated claim and a checked one do not look the same; a score with a decimal point's worth of
precision and none of its provenance is a step directly backwards.

Finally, model tiers move. A routing hint baked into a committed record ages against a lineup
that changes monthly — a `stale_after` claim with no `stale_after`, in a file that has no way to
carry one.

**No failure named. Rejected.**

### `executionMode` — rejected

0006 already answers the question this field asks, and answers it for every task rather than
per-task: nothing leaves `proposed` without a `human:` actor in `acceptedBy`, and everything
finishing passes through `review`. So `ai-draft-human-review` is not a mode to select — it is the
only path §8 offers. What is left of the field is who does the work, which `owner` records.

The stronger objection is the default. The validator writes `executionMode: autonomous` into any
task that lacks it. **A safety-relevant field whose auto-populated value is the least supervised
one is the wrong shape for a safety field** — a field like that must fail closed or not exist.

Adopting it would put a weaker, per-task statement of the human-in-the-loop rule beside the
lifecycle's, and the two disagree on contact: a task marked `autonomous` reads as written
permission to skip the `review` state §8 requires. A second statement of a rule is only ever as
strong as its weakest copy.

**No failure named, and it contradicts 0006. Rejected.**

### `guardrails` — rejected as a field; the failure is real and already housed

This is the one that deserved the most care, and the one where the received summary was wrong on
a checkable point. The case for adopting it rested on the claim that `guardrails` **has no nytka
equivalent at all.** It has two, both normative:

- **§11.3** requires `AGENTS.md` to carry *"safety rules — what must never be modified without
  confirmation."* That is the project-scoped prohibition list.
- **§6** requires every decision to state *"consequences — what this now forces or forbids."*
  That is the prohibition that follows from a binding choice, numbered, immutable and
  supersede-tracked.

The failure is real. This repo spent two days on it: an agent transcribed a private repo's
internal state into public files, and an agent that could not resolve a template placeholder
invented a path and ran it. Nobody had forbidden either in writing.

**But look at where each fix went, because that is the argument.** Both went into `AGENTS.md`, as
standing rules true of every task in the repo forever. Neither could have gone into a task
record: the rule did not exist yet on the day it was broken. **Guardrails hold prohibitions
somebody already knew to write; every expensive failure in this line has been a mechanism nobody
knew about** — npm silently stripping a file, an ignore rule matching a template directory, a
field spliced one line too high. A list cannot contain a rule that has not been discovered, and a
field that claimed to prevent those failures would be taking credit for work it cannot do.

The remaining case is a prohibition genuinely scoped to one task. Tested against the richest
example available — the brief that produced this record — the durable ones were already written
down (§6 forbids amending a `stable` decision; `AGENTS.md` forbids editing generated `tools/`)
and the rest were session preferences that should not outlive the session.

The skill's own enrichment guide names the purpose as *"`guardrails` to prevent scope creep"*,
which is narrower than "what the agent MUST NOT do" and lands somewhere nytka is already
occupied: what a task does and does not cover is what `acceptanceCriteria` bounds. A criterion
says what must be true to close; a guardrail beside it saying what must not be touched is the
same boundary written twice, which is how the shipped example came to contradict itself.

There is also direct evidence that a second place to state scope is a place for scope to
disagree. In the skill's own worked example — the file it ships to demonstrate the target state —
a task's `context` instructs the agent to apply a linked fix before publishing, and the same
task's `guardrails` forbid applying that same fix. **Two writable statements of scope,
contradicting each other in the reference example.** That is P2 demonstrated rather than
predicted, and it is what N copies of a project rule would do here.

**A real failure, in a place that already holds it. Rejected as a task field.**

### `validationCommands` — rejected

It duplicates `acceptanceCriteria[].verification.command`, and the duplication has already
drifted in the schema's own examples. In one, an acceptance criterion's command and the
`validationCommands` entry for the same check differ in their path prefix; in another, the two
copies differ in how they count the result. **Neither pair can both be right, and nothing in the
schema compares them.**

This is P2 in its plainest form — *"two writable copies of a status field is the most common way a
project starts lying to itself"* — reproduced in a shipped reference example within one file.
Nytka already has one place for how a criterion is checked, and §8 already requires `evidence` at
`done` for what checking it produced.

**A named failure, arguing against the field. Rejected.**

### `requiredContext` — rejected

§10 already defines this and mechanises it. The Query table's Task row is *"the task record + the
decisions and procedures it names + any dataset it points at,"* and `nytka context <id>` assembles
exactly that, printing what it deliberately left unopened. The working rule in `unresolved.md` is
explicit about the boundary: *"A tool may load what a task names; it may not guess what a task
meant."*

`requiredContext` is a hand-maintained second list of what to open, beside the links the task
already carries. It drifts from them silently, and nothing checks it: lint's dangling-link check
reads markdown links, so a stale path in a YAML string list is invisible to the one mechanism
that would catch it. That is §1's decay — *plausibly* wrong rather than obviously wrong — with a
field created to host it.

The worked examples show it cannot be mechanised anyway. Of the twelve entries across the four
tasks, **two** are resolvable repo paths. The rest are prose — a page URL, a Sanity document
described by slug, "FAQ sections: pricing, timeline, Poland", an external legal reference, and a
pair of spellings to search for. A list that nothing can resolve five-sixths of is a comment, and
`context` is already the field for comments.

**No failure named, and a duplicate of §10. Rejected.**

### The runnable `verification.command` — rejected as a requirement

§8's existing standard is that *"a good criterion is checkable by someone who was not in the
conversation."* The question is whether requiring a command strengthens that or narrows it to the
criteria a command can express. **The skill's own examples answer it: 6 of the 11 criteria across
its four worked tasks carry `verification: {type: manual}` and no command at all.** In the
reference material for the feature, the majority of criteria cannot use it.

Both registries in this line say the same thing this week. The criteria that closed include *"no
client, company or project data is present anywhere in the repo"* — whose own evidence records
that a scan cannot recognise a name it has never seen — and *"AGENTS.md no longer cites §8 for a
vocabulary §8 does not define,"* which needs a human to read a sentence and judge whether it
miscites. The criterion that produced this record is of exactly that kind. Making the command
mandatory would not have made those checkable; it would have made them unwritable.

**And nytka has nothing to run it.** `AGENTS.md` is explicit that lint *"checks form, never
truth,"* and that a rule needing a linter to be usable is too complex. A command sitting in a
registry that nothing executes is worse than no command: it is a comment shaped like a check. The
`DOC-001` failure is the proof — its criterion *was* a one-line `curl`, and the task still
asserted the repo was private for a day after it went public, because nothing ran it. The command
was never the missing part.

`expected` is the better half of the pair and still does not clear the bar. `ADOPT-001` is the
case: its criterion *"passes lint with zero errors"* went from two errors to zero without the
package changing, because a check was demoted from `error` to `warn` that morning. A command
would have printed PASS. `expected: "0 errors"` would have matched. **A human sentence caught
it**, and that sentence is what `evidence` at `done` already asks for.

**Rejected as a requirement.** Where a criterion does have a cheap mechanical check, the check
belongs in `evidence` when the task closes — which §8 already requires, and which is where the
`git check-ignore` and `npm pack` results in these registries already sit. That is a restatement
of an existing rule, not a new field.

## Consequences

- **§8's minimum task fields do not change, and neither does the `acceptanceCriteria` item
  shape.** A criterion stays a string. FMT-001's fourth criterion is answered by this record.
- **Six rejections are now on the record, so the next proposal starts from them.** A rejection
  recorded is the cheaper half of `unresolved.md`'s working rule: the bar is only meaningful if
  the things that failed it are visible. This is the first worked instance of that bar being
  applied to a concrete set.
- **§13 is untouched.** A project that carries any of these six fields stays conforming — a
  consumer must not reject it for keys it does not recognise. This record says nytka will not
  *require* them, never that a registry may not *hold* them. The skill and its projects are
  unaffected.
- **The convergence evidence in §8 is now first-hand.** 0006 and §8 both rest on the claim that
  this skill's status enum is `todo | in_progress | blocked | done`. That was read from the schema
  on 2026-07-31 and is confirmed. The `todo` alias keeps its justification.
- **`guardrails` leaves one thing genuinely open, and it is not a field.** A prohibition scoped to
  a single task currently arrives in a prompt and vanishes with the session, so a second agent
  picking the task up does not inherit it. Every durable case tested resolved to §11.3 or §6. If
  one turns up that resolves to neither, it is evidence for a new entry in `unresolved.md` — not
  for reopening this record.
- **FMT-001's note that `guardrails` has no nytka equivalent is superseded by this record**, which
  names two. The note stays where it is; P5's habit applies to task context as much as to
  decisions.
