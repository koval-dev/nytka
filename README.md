# Nytka

**Project context for AI agents.**

Nytka keeps a project's tasks, decisions, research, datasets and current state in one
structure that Claude Code, Codex, opencode and anything else that reads files can share.
Instead of re-explaining the project every session, an agent loads only the context its task
needs.

It is a format, not a service: a directory layout, a frontmatter vocabulary, and three
operations (ingest · query · lint). No runtime, no daemon, nothing to install to read it.

## Point an agent at it

```
Read https://raw.githubusercontent.com/koval-dev/nytka/main/SPEC.md
and manage this project according to it.
```

[SPEC.md](SPEC.md) is normative and self-contained — one link is the whole format.
[QUICKSTART.md](QUICKSTART.md) is the short version for an agent that needs to act now.

## Two ways to use it

**Read it and install nothing.** Everything in this repo — the spec, the templates, the
procedures, the scripts in `tools/` — is meant to be read and copied. Your agent is the runtime.

**Or install the packages.** `@nytka/cli` gives you `nytka` as a command, and `@nytka/plugin-*`
are connectors that collect real data into a project's `datasets/`. **The packages are public on
npm; their source repo is private.** They are built separately so this repo stays readable with
nothing installed — you never need their source to use either lane.

```
npx @nytka/cli lint .        # the released build of tools/nytka-lint.mjs, nothing to clone
npx @nytka/cli add plugin-gsc
```

The two lanes are the same format. Nothing here requires the packages, and the packages do not
replace anything here. Verified 2026-07-29 against the npm registry.

## The problem it solves

Project knowledge does not become obviously wrong. It becomes *plausibly* wrong.

A plan says the CMS uses one localisation model. The build used another. Nobody wrote it
down. Six months later an agent reads the plan and generates code against a model that never
shipped. Nothing looked broken at any point.

Agents make this worse from both ends: they produce knowledge quickly and consume it
uncritically. In plain markdown, a generated guess and a fact the client confirmed on the
phone are indistinguishable.

Nytka's premise: **you cannot stop knowledge going stale, so make staleness detectable.**
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

**Often** — install [skills/nytka/SKILL.md](skills/nytka/SKILL.md) as a skill in Claude Code
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

A fourth workflow governs the one resource none of them can replace:
[ask-the-owner](procedures/ask-the-owner.md) is when an agent may interrupt a human, and the
shape a question has to take to be answerable without opening a file.

## Lint

```
node tools/nytka-lint.mjs /path/to/project     # committed here, nothing to install
node tools/nytka.mjs status                    # and the backlog commands, on the same terms
npx @nytka/cli lint /path/to/project           # the same source, from the registry
```

Zero dependencies. Checks expiry dates, unverified external claims, decision-graph
consistency, dangling links, missing `type`, staleness of `current-state.md`, and template
placeholders nobody filled in.

`tools/` is four generated read-only copies of source that lives in `@nytka/cli` — regenerated
on release and drift-tested. Do not edit them here, and **copy the directory rather than one
file out of it**: they import each other by relative path, which needs no `node_modules` but
does need its siblings.

Between releases the committed copies can be *ahead* of the published package, and today they
are — `node tools/nytka-lint.mjs` and `npx @nytka/cli lint` currently disagree on the same
directory. Same source, two release schedules. [current-state.md](current-state.md) says what
the gap is and when it closes.

Lint is the operation most projects skip and the one that pays. Nearly every knowledge
failure in a real project is something it would have flagged.

## Status

**v0.1, draft.** In use on one real project, and exercised from a second direction by a line of
published connectors that write into a project's `datasets/`. The format will change; it is
markdown frontmatter, so migration is a rename.

A connector is tooling, not an adopting project, so the parts only a second adopter would
stress are still untested — agent-reported numbers chief among them. `artifacts/` came off that
list on 2026-07-30: it is now carrying real assets in two repos, which fired the decision trigger
on what it is actually for. It is exercised, not settled. See [unresolved.md](unresolved.md).

Nytka manages itself under its own rules — `project.yaml`, `decisions/` and `current-state.md`
in this repo are the dogfood, and the first bug reports.

## Prior art

Assembled rather than invented. The provenance vocabulary is a subset of Google Cloud's
**Open Knowledge Format**; the ingest/query/lint operations come from **Karpathy's
LLM-maintained wiki** pattern; decision records follow standard **ADR** practice.
Credited in full in [SPEC.md §14](SPEC.md).
