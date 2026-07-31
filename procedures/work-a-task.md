---
type: Procedure
title: Work a task
description: The daily loop from picking up work to closing it, executable with nothing installed
status: draft
generated: { by: claude-opus-5, at: 2026-07-31 }
---

# Procedure — work a task

**Trigger:** you are about to do work on a project that uses this format. Every session starts
here.

**Inputs:** `current-state.md`, the task registry, and — only *after* a task is picked — whatever
that task names.

Every step below is a file you read or a line you edit. `nytka-lint` is the only tool required.
Where a command makes a step faster it is shown as an accelerator; the step is defined by what it
does to the files, never by the command.

---

## Steps

### 1. Read the state before the backlog

`current-state.md` first, then the registry. The narrative tells you what is happening; the list
tells you what must happen, and they fail differently.

If `current-state.md` is more than a month old, treat everything in it as a claim rather than a
fact — that is what lint's staleness warning is for.

### 2. Pick exactly one task

`ready` (or `todo`, which reads as `ready`), highest priority, with nothing still open in
`blockedBy`. **One.** A second task open at the same time is how a `workLog` stops being written:
the record of both becomes a reconstruction at the end of the session.

> Accelerator: `nytka next`

### 3. Check the task is still true before you start it

**This is the most-skipped step and the one with the most scars.** A task's `context` was written
when someone had different information. Before working from it, check what it rests on.

**Never work from a task's summary of something when the thing itself is reachable.** A task in
this line asserted an external tool was not installed; it was. Reading it directly surfaced a
field the task had not known about and corrected three claims in the analysis. Another read *"the
repo exists but is private"* for a day after it had gone public.

If the context is wrong, fix the context first. Then decide whether the task still makes sense —
sometimes the honest answer is `cancelled` with a `reason`, and that is a result, not a failure.

### 4. Load only what the task names

The bounded-context rule (§10, Query; P7). Read the task, then the documents it links, then stop.
Do not scan the package to "get oriented" — orientation is step 1's job and it is already done.

> Accelerator: `nytka context <id>`

### 5. Set it `in_progress` before working, not after

A one-line edit. It is the only way a second agent, or you tomorrow, can tell the difference
between work in flight and work nobody started.

> Accelerator: `nytka task start <id>`

### 6. Write the `workLog` while you work

Append as you go. A `workLog` written at the end is a summary; written as you go it is a record,
and §8 is explicit that an entry rewritten to agree with how things turned out is worth nothing.

Include what you tried that did not work. That is the half nobody can reconstruct later and the
half that stops the next person repeating it.

**Do not write that something is done before doing it.** An agent in this line wrote *"migrated
2026-07-31"* into an instructions file and then stopped before performing the migration. The file
and the registry disagreed, and nothing detected it, because a document asserting a change is
indistinguishable from a document describing one.

### 7. Verify against the thing, not against a report of the thing

Every claim about external state carries a date and a source (P4). Run the command. Read the
file. Query the live system.

The sharpest instance here: a packaging fix was checked against a build artifact, which was
correct, and shipped broken anyway — because the packaging step renamed a file at *install*
time, which only installing it could show. A build artifact is not an install, a dry run is not a
run, and a passing test proves the test passed.

### 8. Move it to `review`, not `done`

**You do not close your own work.** That is the entire reason `review` exists: with no state
between finishing and closing, whoever did the work is also the one declaring it met, which is
the judgment call `acceptanceCriteria` was written to remove.

Against each criterion, state **met and how it was checked** — the command, the file, the system
— or **not met and why**. Then name **the one thing most likely to be wrong**. Whoever just
finished the work knows where it is thinnest, and that is worth more to a reviewer than the
summary.

A criterion that failed sends the task back to `in_progress`. It does not close with a note.

> Accelerator: `nytka task review <id>`

### 9. Distil before you close the loop

**Task completion is an ingest trigger.** Ask ingest's question — did anything here become a
decision, a procedure, a reusable finding, or a change to `current-state.md`? Then use
[ingest's classification table](ingest.md#1-classify-every-piece); it is not repeated here,
because a second copy is how the two start disagreeing.

The failure this prevents happened in this repo: the rules for adding a lint check were worked
out in a session and written down in exactly one place — the `context` field of the task asking
for them to be written down somewhere else. Nobody adding a check could read the rule they were
breaking, and one shipped at the wrong level and was demoted the same day.

`completionSummary` and `evidence` are written **now**, at the transition, by whoever did the
work — not reconstructed later by whoever closes it. §8's fields bind at the transition precisely
so that nobody is ever asked to reconstruct them.

### 10. Lint

```bash
node nytka/tools/nytka-lint.mjs .
```

Zero errors. A warning is either fixed or accepted with a recorded reason.

---

## Approval points

Four things need a human, and an agent may draft all of them and commit none:

- moving any task out of `proposed` (`acceptedBy`, a `human:` actor — §8)
- closing a task in `review`, or sending it back
- promoting a decision to `stable`
- anything spending money, a published version, or a public name

Before interrupting anyone for anything else, run the filter in
[ask-the-owner.md](ask-the-owner.md). Most questions are already answered here or are cheap
enough to decide and record.

---

## Failure conditions

Every row is something that happened in this line, not a hypothetical.

| Symptom | Meaning |
|---|---|
| A task's `context` asserts something that stopped being true | Step 3 skipped. The task was worked from its own summary rather than from the thing. |
| The registry says `in_progress` and nobody is working on it | Step 5 was done and step 8 was not. The board now overstates activity, which is the one number a backlog is asked for. |
| A `workLog` entry reads like a press release | Written at the end, from memory, after the outcome was known. Nothing that failed survived into it. |
| A document says a change was made and the change was not made | Step 6's rule. Worse than no record, because it reads exactly like a true one. |
| A task closed by whoever did the work | `review` skipped. |
| `evidence` written after the close, from memory | P4. An undated reconstruction is the claim this format exists to reject; §8 grandfathers old tasks rather than backfilling them for exactly this reason. |
| Verified against a build, a dry run, or a test | Step 7. None of the three is the thing. |
| `current-state.md` unchanged after a task closed | Step 9 skipped. Either nothing durable happened, or it is now trapped in a task record. |
| A rule that exists only inside a task's `context` field | Step 9 skipped in the direction people miss: the finding was recorded, but where nobody looking for a rule would find it. |
| Two tasks `in_progress` at once | Step 2. Both `workLog`s will be written at the end. |
| A command printed success and the file was wrong | Trust the file, not the exit code. Re-read what you wrote before believing it. |

---

## Done when

The task is in `review` with every criterion answered and the way it was checked recorded;
the `workLog` says how rather than what; anything durable has left the task record and gone where
[ingest](ingest.md) sends it; and lint reports zero errors.

Closing it is somebody else's step.
