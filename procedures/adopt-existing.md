---
type: Procedure
title: Adopt nytka on an existing project
description: Migrate scattered context — chat logs, notes, agent memory — into a nytka package
status: stable
generated: { by: claude-opus-5, at: 2026-07-27 }
verified: [{ by: "human:mike", at: 2026-07-27, against: "a real adoption" }]
---

# Procedure — adopt nytka on an existing project

**Trigger:** a project with accumulated context — strategy docs, chat history, agent memory
files, a task list, notes in YAML comments — that a new agent cannot pick up.

**This procedure has been run on a real project.** The failure conditions below are observed,
not hypothetical.

---

## The governing idea

**Adoption is when you find out what was already wrong.** Budget for that. If a migration
turns up no contradictions, it was a copy, not an adoption — and the stale claims are still
there, now with a tidier layout and more apparent authority.

---

## Steps

### 1. Inventory before writing anything

Walk the actual folder. List every file, sibling repo, external system, script and data
export — including the messy ones and the ones outside the project directory.

Check agent-local memory too (`~/.claude/projects/*/memory/`, Cursor rules, and equivalents).
In one adoption this turned up 13 agent-memory files holding decisions and references that
existed nowhere else: not portable across tools, not versioned with the project, invisible
to anyone else.

Write `inventory.md` first. It is the map for everything after.

### 2. Classify, do not copy

Each piece of existing context goes to exactly one place:

| Source material | Destination |
|---|---|
| Purpose, audience, constraints | `overview.md` |
| A choice that constrains future work | `decisions/` |
| A workflow done more than once | `procedures/` |
| A finding worth reusing | `research/` |
| Collected data | `datasets/index.json` (metadata only) |
| What is happening now | `current-state.md` |
| An open question with no answer | `unresolved.md` |
| Everything else | leave it in the archive |

Discard: greetings, tool narration, abandoned brainstorming, superseded assumptions,
duplicate answers, and raw data already stored elsewhere.

### 3. Verify every inherited claim

**This is the step that matters.** Any claim about an external system gets checked against
that system before it is carried forward, and carries the date it was checked.

In one adoption this found a task backlog describing 6 published articles when the CMS held
9, referencing schema fields that did not exist. That backlog had been driving work.

### 4. Hunt for superseded decisions

For each decision found in old planning documents, ask: *is this what was actually built?*

In one adoption the plan specified one CMS localisation model; the implementation used a
different one. Nobody recorded the change, so the plan stayed authoritative-looking for
months. The fix is two records: the original marked superseded, a new one describing reality.

This is the single highest-value output of an adoption.

### 5. Split state out of storage

Look for files doing two jobs. A task file whose header comments have grown into a changelog
is the classic tell: durable rules, a change log and a verified snapshot all crammed above
the data because there was nowhere else to put them.

Split by lifetime — rules to `decisions/`, log to `history/`, snapshot to `current-state.md`.

### 6. Keep the old folder as a read-only archive

Do not move or delete it. Declare it in `project.yaml`:

```yaml
components:
  archive:
    path: ../old-project-folder
    role: pre-framework working folder — read-only, source material
```

Nothing is destroyed, the migration is reversible, and raw sources stay immutable.

### 7. Lint, then commit

```bash
node nytka/tools/nytka-lint.mjs .
```

Then update any agent memory that points at the old location — otherwise the next session
starts in the archive.

---

## Approval points

- **Before deleting or moving anything** from the original folder. Default is to move nothing.
- **Before recording a decision the owner did not explicitly make.** Inferred decisions are
  `confidence: inferred` and `status: draft` until confirmed.

## Failure conditions

| Symptom | Meaning |
|---|---|
| Migration produced no contradictions | It was a copy. The stale claims survived. |
| A decision has a rationale nobody remembers agreeing to | Reconstructed, not recorded. Mark `confidence: inferred`. |
| The new package repeats a count or fact from an old file | Step 3 was skipped. Verify against the live system. |
| Old and new folders both look writable | Ambiguous truth. Declare the old one an archive explicitly. |
| Agent memory still points at the old path | Next session starts in the archive. Update it. |

## Done when

`project.yaml` and `AGENTS.md` exist, every inherited external claim carries a verification
date, superseded decisions are recorded as such, the old folder is declared read-only, lint
passes, and the first commit exists.
