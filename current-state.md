---
type: State
title: Current state
description: What is happening on nytka right now
status: draft
generated: { by: claude-opus-5, at: 2026-07-27 }
---

# Current state

**Last updated:** 2026-07-27

## Current focus

v0.1 exists and is in use on one real project. The next thing that matters is finding out
where the format is wrong, which means a second adopter with a different shape.

## Active work

- Nothing in progress. v0.1 was written in one pass on 2026-07-27.

## Recent meaningful changes

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

- **A second adopter.** Everything in v0.1 derives from one project — content/CMS work with a
  non-technical approver. Which parts generalise and which are merely shaped by that one case
  is currently indistinguishable.
- The useful contrast would be a **reporting-heavy** project: recurring deliverables, numbers
  pulled from ad and analytics APIs. That exercises `datasets/`, `artifacts/` and
  agent-reported numbers, none of which the first adoption tested.

## Verified snapshots

| Claim | Value | Verified | Against |
|---|---|---|---|
| Adopters in production | 1 | 2026-07-27 | filesystem |
| Lint runs clean on itself | yes | 2026-07-27 | `node tools/nytka-lint.mjs .` |
| Lint dependencies | 0 | 2026-07-27 | source |

## Next deadline

None. Nytka is a tool for other work, not a deliverable.
