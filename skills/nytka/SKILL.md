---
name: nytka
description: Start a new nytka project, adopt an existing project into nytka, or work inside one. Use when asked to set up project context/documentation structure with nytka, scaffold a nytka package, migrate existing project notes into nytka, or lint a nytka package. Nytka is project context for AI agents — project.yaml + AGENTS.md, provenance frontmatter, and the ingest/query/lint operations.
type: Procedure
title: Nytka launcher
status: draft
generated: { by: claude-opus-5, at: 2026-07-27 }
---

# Nytka

A **launcher, not a specification.** This file locates the nytka repo and hands you to the
right procedure inside it. `SPEC.md` in that repo is the only normative source — never answer
a format question from this file, and never scaffold nytka files from memory.

## 1. Resolve the repo

First hit wins. Call the result `$NYTKA`:

1. `$NYTKA_HOME`, if set and it contains `SPEC.md`
2. an existing checkout — check `../nytka` and `~/workspace/projects/nytka`
3. `git clone --depth 1 https://github.com/koval-dev/nytka` into a scratch directory

No checkout and no network? Read
`https://raw.githubusercontent.com/koval-dev/nytka/main/SPEC.md`. It is self-contained; §12
gives the layout to build by hand. That path is the fallback, not the default — the
procedures below carry detail the spec deliberately leaves out.

## 2. Route to one procedure

| Situation | Read |
|---|---|
| New project, no context worth migrating | `$NYTKA/procedures/init-project.md` |
| Existing project with docs, notes, or chat history | `$NYTKA/procedures/adopt-existing.md` |
| Already a nytka package, doing normal work | `$NYTKA/QUICKSTART.md` — reading order and traps |
| New material to fold in | `$NYTKA/procedures/ingest.md` |
| Checking what rotted | `$NYTKA/procedures/lint.md` |

Read the one that applies. Reading all of them is the mistake this table exists to prevent.

Scaffolding comes from `$NYTKA/templates/project/` — copy it and delete what the project does
not need. Generating those files from memory produces a package that looks right and drifts
from the format immediately.

## 3. Before finishing

```bash
node $NYTKA/tools/nytka-lint.mjs .
```

Zero errors, or a recorded reason why not.

## Installing this skill

It is one file and it resolves `$NYTKA` itself, so it works from any location. Symlink rather
than copy, so there is one writable source:

```bash
NYTKA=/path/to/nytka

# Claude Code — reads ~/.claude/skills/<name>/SKILL.md
mkdir -p ~/.claude/skills/nytka
ln -sf "$NYTKA/skills/nytka/SKILL.md" ~/.claude/skills/nytka/SKILL.md

# Codex — reads ~/.agents/skills/<name>/SKILL.md
mkdir -p ~/.agents/skills/nytka
ln -sf "$NYTKA/skills/nytka/SKILL.md" ~/.agents/skills/nytka/SKILL.md

# opencode — reads ~/.config/opencode/command/<name>.md (`commands/` also works)
mkdir -p ~/.config/opencode/command
ln -sf "$NYTKA/skills/nytka/SKILL.md" ~/.config/opencode/command/nytka.md
```

Swap `~` for a project directory (`.claude/skills/`, `.agents/skills/`, `.opencode/command/`)
to scope it to one repo instead of the whole machine.

Install paths are a dated observation about three tools that ship weekly — verified
2026-07-27, re-check before assuming. See
[0005](../../decisions/0005-tool-integration-is-a-pointer.md).
