---
type: Guide
title: Weave quickstart for agents
description: The minimum an agent needs to work in a weave project or start one
status: draft
---

# Quickstart

For an agent that needs to act now. The full format is [SPEC.md](SPEC.md).

## If the project already uses weave

1. Read `project.yaml` — what exists, where components live, how tasks are tracked.
2. Read `AGENTS.md` — project-specific rules. **It overrides this file and the spec.**
3. Read `current-state.md` — active work and blockers.
4. Read only the `decisions/` and `procedures/` your task actually names.

Do **not** auto-scan `research/`, `history/`, `datasets/` payloads, or archive folders.

Then, before you act:

- Check `stale_after` on anything you are about to rely on. Past that date, re-verify first.
- Check `verified`. No `human:` entry means no human has confirmed it.
- Check `confidence`. `inferred` is someone's reasoning, not a fact.
- Any claim about an external system is a dated observation. Re-verify against the system.

## If you are starting a new project

Copy `templates/project/`, then fill in two files. Everything else is optional.

**`project.yaml`** — identity, every component repo and system, tracker mode.

**`AGENTS.md`** — reading order, the single most important project rule stated first,
safety rules, task workflow, evidence format, secrets policy, scope.

Create directories when work needs them. An empty `research/` beats one full of filler.

## If you are adopting an existing project

`procedures/adopt-existing.md`. In short: inventory before writing, distil rather than copy,
**verify every inherited claim against the live system**, keep the old folder as a read-only
archive.

Adoption is when you discover what was already wrong. That is most of its value — budget for
finding contradictions rather than being surprised by them.

## Writing anything new

Frontmatter, minimum:

```yaml
---
type: Research            # required — free string
title: …
status: draft             # draft | stable | deprecated | superseded
generated: { by: <your model id>, at: 2026-07-27 }
confidence: inferred      # stated | inferred | ambiguous
stale_after: 2027-01-01   # if it describes anything that moves
---
```

`stated` means a primary source said it. If you worked it out, it is `inferred` — say so.

## Rules that will bite you

1. **Never edit an accepted decision to change its meaning.** Write a new one, mark the old
   `superseded`, link both ways.
2. **Never overwrite a live system from a file** because the file looks like the spec. The
   live system is the truth; the file is a dated observation.
3. **Never maintain status in two places.** Generated snapshots are read-only.
4. **Never load a dataset payload into context.** Query it with a script; write the
   conclusion into `research/`.
5. **Contradictions are not wording problems.** If new material conflicts with an existing
   file, that is a decision to make or a question to ask — not text to smooth over.

## Before you finish

```
node tools/weave-lint.mjs .
```

Fix what it reports, or record why you are not.
