---
type: Procedure
title: Ingest new material into a nytka package
description: Distil a chat log, research dump or client call into the project package
status: draft
generated: { by: claude-opus-5, at: 2026-07-27 }
---

# Procedure — ingest

**Trigger:** new material arrives that contains knowledge worth keeping — a long agent
session, a client call, a research dump, a handover.

**Ingest is repeatable, not a one-time migration.** The first ingest of an existing project
is `adopt-existing.md`; every one after is this.

---

## The layers

| Layer | Rule |
|---|---|
| **Raw sources** | Immutable. Distil from them; never edit them to match your conclusions. |
| **The package** | Agent-maintained. This is what ingest writes. |
| **`AGENTS.md`** | The schema. Changes only when the project's rules change. |

---

## Steps

### 1. Classify every piece

| Material | Destination |
|---|---|
| Purpose, audience, constraints | `overview.md` |
| A choice that constrains future work | `decisions/` |
| A workflow repeated, or a mistake worth not repeating | `procedures/` |
| A reusable finding | `research/` |
| Collected data | `datasets/index.json` — metadata only, payload stays out |
| Status, blockers, what is next | `current-state.md` |
| Work that must happen, or that just stopped being needed | the task registry in `project.yaml → tasks` |
| A question with no answer yet | `unresolved.md` |
| A completed output | `artifacts/` |
| A milestone or failed approach | `history/timeline.md` |

The task row is easy to skip because the row above it looks like it covers the same ground. It
does not: `current-state.md` is the narrative of what is happening, and the registry is the list
of what must happen. An ingest that updates only the narrative leaves the backlog asserting
things that stopped being true — and no other operation will catch it, because `nytka-lint`
does not read the registry.

A task an ingest *adds* is `proposed`, carrying `proposedBy`. Distilling a chat log is the
moment an agent produces the most plausible work nobody committed to, and SPEC §8 keeps that
separable from the plan. Only a human moves it out of `proposed`.

### 2. Discard aggressively

Greetings · tool narration · abandoned brainstorming · superseded assumptions · duplicate
answers · emotional reactions · raw data already stored elsewhere · reasoning that led
nowhere.

A package that keeps everything is a chat log with folders.

### 3. Stamp provenance on everything new

```yaml
generated: { by: <your model id>, at: <today> }
confidence: inferred        # unless a primary source stated it
stale_after: <date>         # if it describes anything that moves
```

Default to `inferred`. If you worked it out rather than read it, that is what it is.

### 4. Handle contradictions as contradictions

New material conflicting with an existing file is **not** a wording problem.

- Conflicts with a **decision** → a new decision superseding the old one, or a question for
  the owner. Never edit the old record's meaning.
- Conflicts with **research** → check dates. Newer does not automatically win; a verified old
  finding beats an inferred new one.
- Conflicts with a **snapshot of an external system** → the live system decides. Re-verify.
- Cannot be resolved now → `unresolved.md`, with a working rule and a trigger.

Smoothing a contradiction into neutral prose is the worst available outcome: the conflict
disappears from view while remaining in the project.

### 5. Update the entry points

`current-state.md` almost always changes. If it did not, ask whether the ingest was worth
doing. Prune anything now historical into `history/timeline.md` — current-state stays short
or it stops being read.

### 6. Lint

```bash
node nytka/tools/nytka-lint.mjs .
```

---

## Approval points

- **Before recording a decision the owner did not explicitly make.** Mark it
  `confidence: inferred`, `status: draft`, and flag it for confirmation.
- **Before overwriting an existing verified claim** with an unverified new one.

## Failure conditions

| Symptom | Meaning |
|---|---|
| The package grew but nothing was deleted | Step 2 skipped. Ingest is distillation, not accumulation. |
| Everything landed in `research/` | Classification avoided. Most material is state, decisions or nothing. |
| Two files now say different things | Step 4 skipped. Contradictions must be resolved or recorded. |
| Every new claim is `stated` | Provenance treated as a formality. Reasoning is `inferred`. |
| `current-state.md` unchanged | Either nothing happened, or the ingest missed the point. |

## Done when

Every piece worth keeping has a home, contradictions are resolved or recorded in
`unresolved.md`, new claims carry provenance, `current-state.md` reflects reality, and lint
reports no errors.
