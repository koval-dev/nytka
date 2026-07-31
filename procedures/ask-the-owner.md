---
type: Procedure
title: Ask the owner
description: When an agent may spend a human's attention, and the shape a question has to take to earn it
status: draft
generated: { by: claude-opus-5, at: 2026-07-31 }
---

# Procedure — ask the owner

**Trigger:** an agent is about to ask the owner anything, or hand back finished work for a
verdict.

**Inputs:** `SPEC.md`, the project's `decisions/`, `AGENTS.md`, `unresolved.md`, `tasks.yaml`.

Most of this procedure is about *not* asking. An agent accumulates context all session; the
owner does not. Every question is therefore asked from a position of much more context than the
person answering it, and that asymmetry — not question length — is what makes a project feel
like it has got away from the person who owns it.

---

## Step 1 — the filter

Three tests, in order. A question must fail all three before it reaches the owner.

**1. Is it already answered?** Search `SPEC.md`, `decisions/`, `AGENTS.md`, `unresolved.md`. If
a rule covers it, apply the rule and say which one. Asking anyway asks the owner to re-decide
something they already decided, which is how a decision record stops being worth writing.

**2. Is it reversible and cheap?** Reversible: one commit undoes it and nothing outside the repo
saw it. Cheap: no money, no published version, no public name. If both — choose, record the
choice and its reason where the work is, and continue. If the question will come back, that is
P6: `unresolved.md` gets an entry with a **working rule** so work continues and a **decision
trigger** that names the event which schedules the real decision. Parking a question is not
asking one.

**3. What does it spend?** Only three things earn the interrupt:

- something unrecoverable outside the repo — money, a published version, a public name
- a constraint on future work, which is a decision (§6) and is the owner's to make
- the owner's own judgment on work they must accept or check

That third one is not a fallback. The format names exactly three points where a human is
structurally required, and they are all instances of it:

| Point | Field | §8 |
|---|---|---|
| A task leaves `proposed` | `acceptedBy`, a `human:` actor | Lifecycle |
| A task leaves `review` | every `acceptanceCriteria` item checked | Lifecycle |
| An `unresolved.md` trigger fires | a decision record | P6, §6 |

**A question mapping to none of the three is almost always test 1 or test 2 wearing a disguise.**

**Ask before the work, not after.** A question raised once a day's work depends on the answer is
not a question, it is a request to approve something already built — and the owner can feel the
difference even when the wording is identical. If a decision is coming, it is cheapest at the
point where nothing has been written yet.

---

## Step 2 — the shape

A question that passes the filter still has to be answerable **cold**: by someone who has not
read the task, the code, or the previous conversation.

1. **The stakes in one sentence.** What changes depending on the answer. No task IDs, no file
   paths, no jargon from the work. If the stakes cannot be stated without pointing at a ticket,
   the asker does not yet understand the question well enough to ask it.
2. **Two to four options.** Each names **what it costs**, not only what it gives. An option with
   no cost is not an option; it is a recommendation with the tradeoff hidden.
3. **A recommendation, and the reason.** "Whichever you prefer" hands back the analysis the
   agent was better placed to do.
4. **Nothing else.** Not the investigation, not the alternatives already ruled out, not the
   history. Those belong in the task's `workLog`, where they are retrievable and are not
   costing anyone's attention.

**One question at a time.** Several questions at once forces the owner to hold an agenda while
answering, which is the agent's job. If there are several, state the plan first — how many are
coming and what each unlocks — then ask the first. Order by what unblocks the most work.

---

## Step 3 — handing back finished work

Moving a task to `review` is a request for the owner's attention and obeys the same rule: it
must be answerable without reconstructing what happened.

For each acceptance criterion, state **met and how it was checked**, or **not met and why**.
"How it was checked" means the command, the file, or the system it was verified against — not
the assertion that it was.

Then name **the one thing most likely to be wrong**. An agent that has just finished a piece of
work knows where it is thinnest, and that knowledge is worth more to a reviewer than the summary
is.

Never hand back work with "let me know if this looks right". That asks the owner to do the
checking as well as the deciding, which is both jobs.

---

---

## Step 4 — reporting, which is not a question and costs the same

A status report asks for nothing and consumes exactly the attention a question does. It obeys
the same rules, plus two of its own.

1. **Lead with the answer.** What is true now, and what it means. The investigation that produced
   it goes in the `workLog`, where it is retrievable and is not being read by someone who only
   wanted the conclusion.
2. **End with what happens next, and when.** A report with no next action delegates back the one
   thing the reader was hoping had been worked out. "Two things are blocked" is a fact; "I'll do
   X next, and Y needs a decision from you before Thursday" is a report.
3. **An identifier is not a noun.** `TOOL-006` names nothing to anyone who has not opened the
   registry — and the reader is being asked to look up a word before they can parse the sentence
   containing it. Write what the thing *is*: *"promoting the placeholder check"*. If the ID is
   needed to act on it, put it after the plain-language name, not instead of it.
4. **Length is a cost, not a demonstration of rigour.** If the report is longer than the decision
   it supports, it is spending more than it delivers. Thoroughness belongs in the record; the
   report is the index to it.

The test: **someone who read nothing else should finish the report knowing what happened, what it
means, and what happens next.** If they finish it knowing only what was done, it was a work log
posted to the wrong place.

---

## Approval points

The owner, and only the owner:

- accepts a `proposed` task (`acceptedBy` — SPEC §8)
- closes a `review` task, or sends it back
- confirms a decision to `stable`
- authorises anything spending money, a version, or a public name

An agent may draft all four. It may commit none of them.

---

## Failure conditions

| Symptom | Meaning |
|---|---|
| The question names a task ID | Step 2.1 was skipped. The owner is being asked to look something up before they can even parse the question. |
| The owner replies "what is this about?" | The stakes sentence failed. Rewrite it, do not append explanation. |
| Every option sounds good | The costs were left out. Nothing was actually being asked. |
| The owner replies "you decide" | It failed test 1 or 2 and should never have been asked. Record which test, so the same class does not come back. |
| The question arrives after the work is done | Not a question. Approval for a fait accompli, and the main reason an owner stops feeling in control. |
| Several questions in one message | The agent is holding no agenda and has handed the owner one. |
| Work handed back as "is this ok?" | No verdict offered — see step 3. |
| The owner is annoyed rather than answering | Volume. The filter is not being run at all. |
| A long answer whose decision is in the last paragraph | The stakes were buried under the investigation. `workLog` is where investigation goes. |
| The report is a list of identifiers | Step 4.3. The reader is being asked to do lookups before they can read the sentence. |
| The report ends without a next action | Step 4.2. Whatever it was reporting, the reader now has to work out what to do about it. |
| The report is longer than the work it describes | Step 4.4. |

The last six are the ones this procedure was written from, on 2026-07-31 — the first three when
the owner said the output was "not for humans", and the last three the same day, when the session
that wrote this procedure immediately broke it in its next message. That is the ordinary case
rather than an embarrassing one: a rule that is only ever applied to questions leaves reports
untouched, and reports are most of what an owner actually reads.

---

## Done when

The owner answered in under a minute without opening a file — or was never asked, because the
question was already answered, or was cheap enough to decide and record.
