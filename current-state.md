---
type: State
title: Current state
description: What is happening on nytka right now
status: draft
generated: { by: claude-opus-5, at: 2026-07-29 }
verified:
  - { by: claude-opus-5, at: 2026-07-29, against: npm-registry }
  - { by: claude-opus-5, at: 2026-07-29, against: kd-nytka-working-tree }
confidence: inferred
---

# Current state

**Last updated:** 2026-07-29

## Current focus

v0.1 exists and is in use on one real project. The next thing that matters is still finding a
second **adopter** with a different shape.

What changed on 2026-07-29 is not an adopter but a **second lane**. Eight `@nytka/*` packages
are published, including a CLI, so the format can now be used by installing something as well
as by reading this repo. The owner stated the rule that separates the two — *installable ships
from the development repo, referenced-with-no-installation stays here* — and it immediately
decided where lint's source lives. Both lanes run the same conformance code.

## Active work

- **SPEC-002** — name the task lifecycle in SPEC §8, per draft decision
  [0006](decisions/0006-task-lifecycle.md). In progress since 2026-07-28; blocked on two open
  points before the SPEC edit (see the task and the decision).
- **TOOL-002** — write down the rules for adding a lint check. Now the larger half of what this
  repo owes lint: the implementation moved out under 0009, the rules did not.

## Recent meaningful changes

- **2026-07-29** — **`tools/nytka-lint.mjs` is no longer this repo's to edit.** Its writable
  source moved to `@nytka/cli` in the development repo; the file here is a generated read-only
  copy with a header saying so, regenerated on release and checked by a drift test there. SPEC
  P2 permits exactly this shape — one writable definition of conformance, synced one way.
  Recorded as that repo's decision 0009. Nothing changes for a reader: still committed, still
  one file, still zero dependencies, still `node tools/nytka-lint.mjs .` with nothing installed.

- **2026-07-29** — **the two-lane rule was stated by the owner and now decides this repo's
  boundary.** *If it needs to be installed, it ships from the development repo; if it only needs
  to be referenced with no installation, it lives here.* `AGENTS.md` previously gave only the
  conclusion — "no code, no packages, ever" — which left every borderline artefact to be
  re-argued. Lint was the first that appeared to belong to both lanes, and did not: its source
  is installable, its committed artefact is referenced.

- **2026-07-29** — **`README.md` names the installable lane for the first time.** Someone
  reading this repo had no way to learn `@nytka/cli` exists. `npx @nytka/cli lint .` runs the
  same checks as the committed script; verified 2026-07-29 against the npm registry by running
  it against this repo (`0 error(s), 18 document(s) checked`).

- **2026-07-29** — **three format questions were added to `unresolved.md`, all found by
  connectors rather than by design**: where collected payloads live when they are registered but
  must never enter an agent's context; whether `datasets/index.json` has a serialisation
  contract (an appending writer reflowed 78 lines into 97 and made the diff unreviewable); and
  where a record of an **external mutation** lives, which the format has no shape for at all —
  it describes collecting, not changing. The third arrived with the first write-capable
  connector and is the one most likely to need a new category.

- **2026-07-29** — **TOOL-003 and TOOL-004 moved to the development repo.** They are
  implementation work on lint, and under 0009 implementation work follows the source. TOOL-001
  and TOOL-002 stay here: they are lint's documentation and its rules, which are referenced,
  not installed.

- **2026-07-28** — **the supersede this file was waiting on was written.** The development
  repo's build-order gate — a two-week hand-run before any runtime work — was removed as its
  decision 0007, on the grounds that shipping had already produced better evidence than the
  rehearsal was designed to collect. Six format findings came out of it; three of them are now
  the `unresolved.md` entries above, and the rest were already absorbed here.

- **2026-07-28** — **the rename to `nytka` was published.** It had been complete in the working
  tree since 2026-07-27 but only committed here as `087cbb1`; `SPEC.md` now reads `title: Nytka`
  with no remaining `weave` string.

- **2026-07-28** — the repo boundary was stated at the top of `AGENTS.md`: this repo holds rules
  only, the development repo holds all code and packages. Written down because the confusion it
  corrects was never about the two repos' names, it was that no file said which one held what.

- **2026-07-28** — decision [0006](decisions/0006-task-lifecycle.md) drafted: tasks get a named
  lifecycle, and no task leaves `proposed` without a human `acceptedBy`. Not yet confirmed by
  the owner — see Active work.

- **2026-07-28** — the open question of where durable non-text files go, and how they carry
  provenance, was recorded in `unresolved.md`, raised by the first logo needing a home.

- **2026-07-27** — primary description changed from mechanism-first ("a directory layout, a
  frontmatter vocabulary, and three operations") to category-first ("project context for AI
  agents") in README, SPEC, `project.yaml` and the skill description. The old opener told a
  reader what nytka is made of before telling them what it is for.

- **2026-07-27** — tool wiring corrected and a launcher skill added ([0005](decisions/0005-tool-integration-is-a-pointer.md)).
  The recommended `.codex/` pointer did not exist; Codex and opencode read root `AGENTS.md`
  directly, and only Claude Code needs a pointer. First case of the repo documenting wiring
  it had never checked.

- **2026-07-27** — nytka extracted from a real adoption: SPEC.md, the project template, four
  procedures, and a zero-dependency lint tool.

## Blockers

None.

## Waiting

- **A second adopter with a different shape.** Everything in v0.1 still derives from one
  project — content/CMS work with a non-technical approver. Which parts generalise and which
  are merely shaped by that one case is currently indistinguishable. Six published connectors
  now write real payloads into `datasets/`, which is the first sustained outside exercise of
  that part of the format and produced the three new open questions above — but a connector is
  tooling, not an adopting project. `artifacts/` and agent-reported numbers are still untested,
  and the wait continues.

## Verified snapshots

| Claim | Value | Verified | Against |
|---|---|---|---|
| Adopters in production | 1 project + 1 tooling line (8 published packages) | 2026-07-29 | npm registry |
| Lint runs clean on itself | yes | 2026-07-29 | `node tools/nytka-lint.mjs .` |
| Lint dependencies | 0 | 2026-07-27 | source |
| `tools/nytka-lint.mjs` is a generated copy | yes | 2026-07-29 | file header + `@nytka/cli` 0.2.0 |
| `npx @nytka/cli lint` runs the same checks | yes | 2026-07-29 | run against this repo from the registry |
| Published connectors | 6 (`gsc` 0.3.3, `ga4` 0.2.3, `sanity` 0.3.2, `gtm` 0.1.2, `dataforseo` 0.1.3, `ads` 0.1.1) | 2026-07-29 | npm registry |
| Published runtime | `@nytka/cli` 0.2.0, `@nytka/core` 0.1.0 | 2026-07-29 | npm registry |
| A connector has run against a live external system | yes, for five of six | 2026-07-29 | development repo's `current-state.md` |

## Next deadline

None. Nytka is a tool for other work, not a deliverable.
