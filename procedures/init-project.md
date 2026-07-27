---
type: Procedure
title: Initialize a new weave project
description: Scaffold a weave package for a project that has no existing context
status: draft
generated: { by: claude-opus-5, at: 2026-07-27 }
---

# Procedure — initialize a new project

**Trigger:** starting a project with no accumulated context worth migrating.
If context already exists in any form, use `adopt-existing.md` instead.

**Inputs:** project name, what it is for, who owns it, which repos and systems exist.

---

## Steps

### 1. Copy the template

```bash
cp -R weave/templates/project my-project
cd my-project && git init
```

### 2. Fill `project.yaml`

The only fields that need real thought:

- **`id`** — a stable slug. It ends up in scripts and cross-references. It never changes.
- **`components`** — every codebase and hosted system, each with its path and repo. This is
  the field that earns its keep; without it an agent infers the layout by stumbling around.
- **`tasks.tracker`** — `file` unless a tracker already exists and is genuinely used.
  Starting with `file` and migrating later is cheap. Starting with an unused Jira is not.

### 3. Write `AGENTS.md`

The template has the section headings. Two rules:

- **The single most important project rule goes first**, stated bluntly. If an agent reads
  one paragraph, that paragraph should stop the worst mistake available.
- **Say what not to read.** Reading order matters less than the exclusions — an agent that
  auto-scans `research/` every session burns context on knowledge it does not need.

Keep it under ~150 lines. Longer files get skimmed.

### 4. Delete what you do not need

Empty directories are noise and imply the project has knowledge it does not. Delete
`research/`, `datasets/`, `artifacts/`, `history/` until real work produces something.

`private/` stays — it exists so the gitignore rule has something to protect.

### 5. Point the tools at `AGENTS.md`

Create a pointer only for a tool that will not read `AGENTS.md` on its own. As of 2026-07-27
that is Claude Code — the template's `CLAUDE.md` already covers it with an `@AGENTS.md`
import. Codex and opencode read the root `AGENTS.md` directly and need nothing.

Which tools need a pointer is a dated observation about software that ships weekly, kept in
[0005](../decisions/0005-tool-integration-is-a-pointer.md) with an expiry. Re-check it rather
than trusting this line.

**Pointers, never copies.** Copies drift, and then your tools disagree with each other about
how the project works.

### 6. Record the founding decisions

Anything already chosen — stack, hosting, language strategy — is a decision. Write the
records now, while the reasons are still known. A decision recorded six months later has a
reconstructed rationale, which is worth much less than the real one.

### 7. Lint and commit

```bash
node /path/to/weave/tools/weave-lint.mjs .
git add -A && git commit -m "Initialize weave project package"
```

---

## Approval points

None — a new project has nothing to damage. This is the one weave procedure that is safe to
run unsupervised.

## Failure conditions

| Symptom | Cause | Fix |
|---|---|---|
| `AGENTS.md` grew past 200 lines | project rules mixed with procedures | move workflows into `procedures/`, link them |
| Every directory exists but most are empty | scaffolded rather than grown | delete the empty ones |
| `overview.md` and `current-state.md` say the same thing | the split is not understood | overview = years, current-state = weeks |
| Decisions written as "we should probably…" | proposals recorded as decisions | a decision is a choice made, with consequences |

## Done when

`project.yaml` and `AGENTS.md` are filled in, founding decisions are recorded, lint reports
no errors, and the first commit exists.
