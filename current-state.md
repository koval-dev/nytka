---
type: State
title: Current state
description: What is happening on nytka right now
status: draft
generated: { by: claude-sonnet-5, at: 2026-07-28 }
---

# Current state

**Last updated:** 2026-07-28

## Current focus

v0.1 exists and is in use on one real project. The next thing that matters is still finding a
second **adopter** with a different shape — but the format has also just had its first real
exercise from a different direction: `koval-dev/kd-nytka`, the development repo, published two
connector packages that write into a project's `datasets/`. A connector is tooling, not an
adopting project, so it does not close the "second adopter" question below — but it is the
first time anything other than the original project has written to `datasets/index.json`, and
it surfaced format friction in a day. Verified 2026-07-28 against `../kd-nytka/current-state.md`.

## Active work

- **SPEC-002** — name the task lifecycle in SPEC §8, per draft decision
  [0006](decisions/0006-task-lifecycle.md). In progress since 2026-07-28; blocked on two open
  points before the SPEC edit (see the task and the decision).

## Recent meaningful changes

- **2026-07-28** — **the rename to `nytka` was published.** It had been complete in the
  working tree since 2026-07-27 but only committed here as `087cbb1`; `SPEC.md` now reads
  `title: Nytka` with no remaining `weave` string. Verified 2026-07-28 against
  `raw.githubusercontent.com` per `../kd-nytka/current-state.md`, which checked the same thing
  from its side.
- **2026-07-28** — the repo boundary was stated at the top of `AGENTS.md`: this repo holds
  rules only, `koval-dev/kd-nytka` holds all code and packages. Written down because the
  confusion it corrects was never about the two repos' names, it was that no file said which
  one held what.
- **2026-07-28** — decision [0006](decisions/0006-task-lifecycle.md) drafted: tasks get a
  named lifecycle, and no task leaves `proposed` without a human `acceptedBy`. Not yet
  confirmed by the owner — see Active work.
- **2026-07-28** — the open question of where durable non-text files go, and how they carry
  provenance, was recorded in `unresolved.md`, raised by the first logo needing a home. A
  worked instance already exists at `../kd-nytka/artifacts/`, decided there as its own 0005.
- **2026-07-28** — **two npm packages published from the development repo:**
  `@nytka/plugin-gsc` 0.2.0 and `@nytka/plugin-ga4` 0.1.0, both collecting live data into a
  project's `datasets/`. Verified 2026-07-28 against `../kd-nytka/packages/*/package.json` and
  its `.github/workflows/publish.yml`.
- **2026-07-28** — **`koval-dev/kd-nytka`'s own build-order gate was bypassed by shipping,
  not by waiting.** That repo's decision 0003 required its task workflow to be hand-run for
  two weeks before any runtime was built, as the gate on building a CLI there. A workspace, a
  publish pipeline and both connectors shipped in a day instead, and found more real format
  friction than the wait was designed to collect — where credentials live, that
  `datasets/index.json`'s formatting is load-bearing, that a dataset id built from a fetch
  window drifts daily, that there is no format category for executable code, and a UTC-stamped
  date disagreeing with every human-written date in a project (the same bug fixed here — see
  Verified snapshots). That decision and its supersede belong entirely to `koval-dev/kd-nytka`
  — build order is a decision that constrains more than one repo, and per that repo's own
  `decisions/README.md`, decisions of that shape live in the hub, not here. As of this read
  (2026-07-28), the supersede was recorded as pending in `../kd-nytka/tasks/tasks.yaml`
  (`FMT-003`) but not yet written.
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
  are merely shaped by that one case is currently indistinguishable. The development repo's
  two connectors (above) write real payloads into `datasets/` and are the first outside
  exercise of that part of the format, but a connector is tooling, not an adopting project —
  `artifacts/` and agent-reported numbers are still untested, and the wait continues.
- A supersede for `koval-dev/kd-nytka`'s decision 0003 (the build-order gate) — pending there
  as of 2026-07-28, not this repo's to write.

## Verified snapshots

| Claim | Value | Verified | Against |
|---|---|---|---|
| Adopters in production | 1 project + 1 tooling consumer (`koval-dev/kd-nytka`) | 2026-07-28 | filesystem + `../kd-nytka/current-state.md` |
| Lint runs clean on itself | yes | 2026-07-28 | `node tools/nytka-lint.mjs .` |
| Lint dependencies | 0 | 2026-07-27 | source |
| Lint's `TODAY` uses the local calendar date, not UTC | yes | 2026-07-28 | source (`tools/nytka-lint.mjs`) + `date` vs `date -u` on a UTC-4 host |
| `@nytka/plugin-gsc` published | v0.2.0 | 2026-07-28 | `../kd-nytka/packages/plugin-gsc/package.json` |
| `@nytka/plugin-ga4` published | v0.1.0 | 2026-07-28 | `../kd-nytka/packages/plugin-ga4/package.json` |

## Next deadline

None. Nytka is a tool for other work, not a deliverable.
