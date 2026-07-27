# Weave

**Project context for AI agents.**

Weave keeps a project's tasks, decisions, research, datasets and current state in one
structure that Claude Code, Codex, opencode and anything else that reads files can share.
Instead of re-explaining the project every session, an agent loads only the context its task
needs.

It is a format, not a service: a directory layout, a frontmatter vocabulary, and three
operations (ingest · query · lint). No runtime, no daemon, nothing to install to read it.

## Point an agent at it

```
Read https://raw.githubusercontent.com/koval-dev/weave/main/SPEC.md
and manage this project according to it.
```

[SPEC.md](SPEC.md) is normative and self-contained — one link is the whole format.
[QUICKSTART.md](QUICKSTART.md) is the short version for an agent that needs to act now.

## The problem it solves

Project knowledge does not become obviously wrong. It becomes *plausibly* wrong.

A plan says the CMS uses one localisation model. The build used another. Nobody wrote it
down. Six months later an agent reads the plan and generates code against a model that never
shipped. Nothing looked broken at any point.

Agents make this worse from both ends: they produce knowledge quickly and consume it
uncritically. In plain markdown, a generated guess and a fact the client confirmed on the
phone are indistinguishable.

Weave's premise: **you cannot stop knowledge going stale, so make staleness detectable.**
Every claim records who made it, when, against what, and when to stop trusting it. A package
that has rotted says so, instead of reading exactly as confidently as one that has not.

## What that looks like

```yaml
---
type: Decision
title: Postgres for the primary datastore
status: stable
verified: [{ by: "human:owner", at: 2026-04-19 }]
confidence: stated
stale_after: 2027-04-19
---
```

Trust tier is derived, never written: no `verified` → **unverified**; agents only →
**machine-confirmed**; a `human:` verifier → **human-reviewed**.

## Layout

```
project.yaml      identity, components, tracker mode      REQUIRED
AGENTS.md         canonical agent instructions            REQUIRED
overview.md       stable context
current-state.md  what is happening now — kept short
unresolved.md     open questions + working rule + trigger
tasks/ decisions/ procedures/ research/ datasets/
references/ artifacts/ history/ private/
```

Only the first two are required. The rest appear when real work needs them.

## Getting started

**New project** — copy [templates/project/](templates/project/), fill in `project.yaml` and
`AGENTS.md`, delete what you do not need, run lint.
See [procedures/init-project.md](procedures/init-project.md).

**Existing project** — [procedures/adopt-existing.md](procedures/adopt-existing.md).
Inventory first, distil rather than copy, verify inherited claims against the live system,
keep the old folder as a read-only archive.

**Often** — install [skills/weave/SKILL.md](skills/weave/SKILL.md) as a skill in Claude Code
or Codex, or a command in opencode; install instructions are in the file. It is a launcher,
not a second spec: it locates this repo and routes to one procedure. Nothing depends on it —
pasting the SPEC.md link stays the supported path.

Once a project exists, `AGENTS.md` is what agents read. Codex and opencode pick it up at the
project root with no configuration; Claude Code needs the `CLAUDE.md` pointer the template
ships. See [decisions/0005](decisions/0005-tool-integration-is-a-pointer.md).

## Operations

Three operations keep a package honest — [ingest](procedures/ingest.md),
query, and [lint](procedures/lint.md). Ingest distils new material in;
query loads the narrowest level that answers a question; lint checks what rotted.

## Lint

```
node tools/weave-lint.mjs /path/to/project
```

Zero dependencies. Checks expiry dates, unverified external claims, decision-graph
consistency, dangling links, missing `type`, and staleness of `current-state.md`.

Lint is the operation most projects skip and the one that pays. Nearly every knowledge
failure in a real project is something it would have flagged.

## Status

**v0.1, draft.** In use on one real project. The format will change; it is markdown
frontmatter, so migration is a rename.

Weave manages itself under its own rules — `project.yaml`, `decisions/` and `current-state.md`
in this repo are the dogfood, and the first bug reports.

## Prior art

Assembled rather than invented. The provenance vocabulary is a subset of Google Cloud's
**Open Knowledge Format**; the ingest/query/lint operations come from **Karpathy's
LLM-maintained wiki** pattern; decision records follow standard **ADR** practice.
Credited in full in [SPEC.md §14](SPEC.md).
