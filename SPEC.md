---
type: Specification
title: Nytka — project context specification
description: Project context for AI agents — a file format and method for project knowledge that both humans and agents can maintain
status: draft
version: "0.1"
generated: { by: "human:mike + claude-opus-5", at: 2026-07-27 }
stale_after: 2027-07-27
---

# Nytka v0.1

**Nytka is project context for AI agents: a directory layout, a frontmatter vocabulary and
three operations that keep a project's tasks, decisions, research, data and current state
accurate while agents write most of it.**

This file is normative and self-contained. Linking an agent to this one document gives it
everything it needs to work on, or start, a nytka project. Everything else in the nytka
repo is tooling or examples.

---

## 1. The problem

Project knowledge decays in a specific way. It does not become obviously wrong — it becomes
*plausibly* wrong. A plan says the CMS uses one localisation model; the build used another;
nobody wrote it down; six months later an agent reads the plan and generates code against a
model that never shipped.

Agents make this worse in both directions. They produce knowledge fast, and they consume it
uncritically. A generated claim and a human-verified fact look identical in markdown.

Nytka's premise: **you cannot prevent knowledge from going stale, so make staleness
detectable.** Every claim carries who made it, when, against what, and when to stop trusting it.

---

## 2. Principles

**P1 — Split by lifetime, not by topic.**
Durable knowledge (years: purpose, decisions, procedures) lives in git files. Operational
state (days: ticket status, transitions, comments) lives in a tracker. Git is bad at churn
and has no timeline; trackers are bad at review and portability. Do not put both in one file.

**P2 — One writable source per fact.**
Every fact has exactly one place it can be edited. Generated views are read-only and say so.
Sync runs in one direction. Two writable copies of a status field is the most common way a
project starts lying to itself.

**P3 — The live system is the truth.**
Files that describe an external system (a CMS, an ad account, a deployed site) are dated
observations, not facts. Re-verify before acting. A file may never overwrite a live system
on the grounds that the file is "the spec".

**P4 — Undated is unverified.**
Any claim about external state carries a date and a source. No date means the claim has no
standing, regardless of how confident the prose sounds.

**P5 — Superseded knowledge stays visible.**
Never edit an accepted decision to change its meaning. Write a new one, mark the old
`superseded`, link them both ways. The wrong old decision is how you discover *why* the new
one exists.

**P6 — Temporary rules are labelled as temporary.**
Unresolved questions get a working rule and a trigger for settling them. A stopgap presented
as architecture is worse than an open question.

**P7 — Load the level you need.**
Portfolio, project, task. Never load a whole project package to do one task.

**P8 — Be liberal in what you accept.**
Unknown frontmatter keys, unknown types, broken cross-links and missing index files are not
errors. A consumer must not reject a bundle over them. This lets the format evolve without
coordinated upgrades. *(Convention adopted from Google's Open Knowledge Format.)*

---

## 3. Directory layout

```
project-root/
├── project.yaml         identity, components, tracker mode        REQUIRED
├── AGENTS.md            canonical agent instructions              REQUIRED
├── CLAUDE.md            pointer to AGENTS.md (and peers)          optional
├── README.md            human entry point                         recommended
├── overview.md          stable context: purpose, audience, scope  recommended
├── current-state.md     what is happening now — kept short        recommended
├── inventory.md         every folder, repo and system, incl. messy ones
├── unresolved.md        open questions + working rule + trigger
│
├── tasks/               task registry and/or tracker snapshot
├── decisions/           numbered, immutable, supersede-only
├── procedures/          repeatable workflows
├── research/            distilled conclusions with expiry
├── datasets/            registry of collected data (metadata committed, payloads not)
├── references/          external system identifiers, no credentials
├── artifacts/           outputs worth referencing
├── history/             compressed timeline, superseded decisions, failed approaches
└── private/             gitignored: contacts, account IDs, owner answers
```

Only `project.yaml` and `AGENTS.md` are required. Everything else appears when real work
needs it. An empty `research/` is better than a `research/` full of speculative filler.

---

## 4. `project.yaml`

Declares what exists. Not a history and not a plan.

```yaml
schemaVersion: "0.1"

id: acme-web                    # stable slug, never changes
name: ACME Corp Website
type: client                    # client | own-business | side-project | internal
status: active                  # active | paused | archived

purpose:
  description: One or two sentences on what this is
  primaryOutcome: The single measurable thing success means

owners:
  projectOwner: Mike
  businessOwner: private-reference     # never a real name in a shareable file

components:                     # every codebase and system, each its own repo
  frontend:
    path: ../acme-astro
    repo: github.com/org/acme-astro
    framework: astro-5
    hosting: netlify
    status: live

capabilities: [seo, content, reporting]

tasks:
  tracker: file                 # file | github-projects | linear | jira
  storage: registry             # registry (one file) | files (one per task)
  registry: tasks/tasks.yaml
  snapshot: tasks/snapshot.md   # generated, read-only, gitignored
  idPrefixes: [WEB, SEO, CONT]
```

`components` is the field that earns its keep. Most real projects span several repos plus
hosted systems; without this, an agent infers the layout from whatever it stumbles across.

---

## 5. Frontmatter vocabulary

Every markdown file except `README.md` and pure pointers carries YAML frontmatter.
One field is required: `type`.

*This vocabulary is a deliberate subset of Google's Open Knowledge Format (OKF), so nytka
documents stay readable by OKF-aware tooling. Nytka adds `confidence` and `supersedes`.*

```yaml
---
type: Decision                  # REQUIRED. free string; see common types below
title: Use a headless CMS for content
description: One line, used in listings
status: stable                  # draft | stable | deprecated | superseded

generated: { by: claude-opus-5, at: 2026-07-27 }
verified:
  - { by: "human:owner", at: 2026-07-27, against: cms }
  - { by: "process:lint", at: 2026-07-28 }

confidence: stated              # stated | inferred | ambiguous
stale_after: 2027-04-19         # omit if it does not expire

sources:
  - { id: vendor-docs, resource: https://…, last_modified: 2026-04-19 }

supersedes: 0004
superseded_by: null
tags: [cms, content]
---
```

### Actor convention

| Form | Meaning |
|---|---|
| `human:<id>` | a person |
| `process:<id>` | an automated process |
| `<producer>/<version>` or a bare model id | an agent |

**Trust tier is derived, never written:**

| Condition | Tier |
|---|---|
| no `verified` entry | **unverified** |
| `verified` by agents/processes only | **machine-confirmed** |
| at least one `human:` verifier | **human-reviewed** |

This distinction is the point of the whole vocabulary. An agent-generated claim and a fact
the client confirmed on the phone must not look the same in a file.

### `confidence`

| Value | Meaning |
|---|---|
| `stated` | asserted by a primary source — a law, an API response, the owner |
| `inferred` | derived by reasoning; plausible, unconfirmed |
| `ambiguous` | sources conflict, or the claim is known to be shaky |

Default to `inferred` when writing something you worked out rather than read. A demand
calendar you reasoned from a business model is `inferred`; a statutory deadline is `stated`.

### `stale_after`

An absolute date. On or after it, the document is stale and must be re-verified before use —
not "probably still fine". Required for anything describing a moving external system.

---

## 6. Decisions

One file per decision: `decisions/NNNN-kebab-title.md`. Numbers are never reused or renumbered.

```md
---
type: Decision
title: Postgres for the primary datastore
status: stable
verified: [{ by: "human:owner", at: 2026-04-19 }]
supersedes: null
superseded_by: null
---

## Decision      what was chosen, imperative
## Reason        why — including the evidence
## Consequences  what this now forces or forbids
```

**Superseding:** create the new record with `supersedes: NNNN`; set the old one's
`status: superseded` and `superseded_by`. Change nothing else in the old file. Both stay in
the repo forever.

A decision belongs here if it constrains future work. Casual opinions and one-off task
judgments do not.

---

## 7. Procedures

A workflow that has been done twice and went wrong the same way both times. Each states:

**Trigger · Inputs · Steps · Approval points · Failure conditions · Done when**

The failure-conditions table is the part that carries the value — it is where the scar
tissue lives. A procedure without one is a tutorial, not a procedure.

---

## 8. Tasks

Nytka does not mandate a tracker. `project.yaml → tasks.tracker` declares it, and `AGENTS.md`
documents the workflow for the declared mode.

**`tracker: file`** — a registry file is authoritative. Cheap, offline, diffable, portable
to clients without tooling. Poor at history; cannot span repos.

**`tracker: github-projects`** (or linear/jira) — issues own status. Free event timeline,
spans repos. Requires network; costs API calls to read.

**When using an external tracker, P2 is binding:** issues own status, the repo holds a
*generated read-only snapshot* so agents get cheap offline context, and sync runs
tracker → file only. Never the reverse.

Minimum task fields: `id`, `title`, `status`, `priority`, `owner`, `blockedBy`, `context`,
`created`, `updated`, `acceptanceCriteria`.

`acceptanceCriteria` is not decorative. Without it, "done" is a judgment call, and tasks get
closed against what a draft said rather than what the live system shows. A good criterion is
checkable by someone who was not in the conversation.

---

## 9. Datasets

Collected data is registered, not pasted. `datasets/index.json` is committed; payloads are
gitignored.

```json
{
  "id": "keyword-audit-2026-04",
  "source": "<provider>",
  "collectedAt": "2026-04-19",
  "validUntil": "2026-10-19",
  "rawPath": "reports/keyword-audit.json",
  "sizeBytes": 227000000,
  "summary": "Keyword volumes across the mapped URLs, both locales.",
  "status": "current",
  "warning": "~227 MB. Never load into context. Query with a script."
}
```

`status`: `current` (safe to use) · `historical` (a record of what happened, not of what is
true) · `stale` (superseded, kept for provenance).

**A dataset is evidence; a research item is knowledge.** Query the payload with a script,
write the conclusion into `research/`, and never load a payload into an agent's context.

---

## 10. The three operations

Adapted from Andrej Karpathy's LLM-maintained wiki pattern. The insight: the hard part of a
knowledge base is not reading or thinking, it is bookkeeping — which is exactly what agents
are good at and humans abandon.

### Ingest

New material — a chat log, a research dump, a client call — is distilled into the package.
It is a repeatable operation, not a one-time migration.

1. Read the source. Classify each piece: stable context → `overview.md`; a binding choice →
   `decisions/`; a repeated workflow → `procedures/`; a finding → `research/`; collected data
   → `datasets/`; current state → `current-state.md`; an open question → `unresolved.md`.
2. Discard: greetings, tool narration, abandoned brainstorming, superseded assumptions,
   duplicate answers, raw data stored elsewhere.
3. Every new claim gets `generated`, `confidence` and — if it describes an external system —
   `stale_after`.
4. **Contradictions are not merged.** If new material conflicts with an existing file, that
   is a decision to make or an owner question to ask, not a wording problem to smooth over.
5. Run lint.

Raw sources are immutable. Distil from them; never edit them to match your conclusions.

### Query

Load the narrowest level that answers the question.

| Level | Load |
|---|---|
| **Portfolio** | `project.yaml` + `current-state.md` |
| **Project** | the above + `overview.md` + `decisions/` + the relevant procedure |
| **Task** | the task record + the decisions and procedures it names + any dataset it points at |

`research/`, `history/`, `datasets/` payloads and archives are never auto-scanned.

### Lint

A health check, run at session start and after any ingest. It reports:

| Check | Catches |
|---|---|
| `stale_after` in the past | claims nobody re-verified |
| unverified claims about external state | generated guesses treated as fact |
| decision graph consistency | a `supersedes` with no matching `superseded_by` |
| dangling links | references to files that no longer exist |
| missing `type` | files outside the vocabulary |
| `current-state.md` age | a "current" state that stopped being current |
| orphaned documents | nothing links to them |

Lint is the highest-value operation and the one most projects skip. Nearly every knowledge
failure in a real project is something a lint pass would have flagged: a superseded decision
never marked, a count that drifted from the live system, a string that got "corrected" to a
wrong value in seventeen files.

Nytka ships `tools/nytka-lint.mjs` — zero dependencies, `node tools/nytka-lint.mjs <dir>`.

---

## 11. `AGENTS.md`

One canonical instruction file per project. Several agent tools read `AGENTS.md` at the
project root directly. For the ones that do not, a tool-specific file (`CLAUDE.md`,
`.cursor/rules/`, `.github/copilot-instructions.md`) points at it — never copies it. Copies
drift, and then agents disagree with each other about how the project works.

Check what a tool actually reads before writing a pointer for it. A pointer file that nothing
loads is worse than no pointer: it looks like wiring, so nobody tests whether the wiring
works. Which tools need one is a dated observation, not a property of the format.

It must contain:

1. **Reading order** — and explicitly what *not* to auto-scan
2. **The single most important project rule**, stated first and bluntly
3. **Safety rules** — what must never be modified without confirmation
4. **Task-state workflow** for the declared tracker mode
5. **Evidence rules** — the format for dated claims
6. **When to create a decision** — and when not to
7. **Secrets policy**
8. **Scope** — what does not belong in this repo

Keep it under roughly 150 lines. An instruction file nobody finishes is an instruction file
nobody follows.

---

## 12. Starting a project

**New project:** copy `templates/project/`, fill `project.yaml` and `AGENTS.md`, delete the
directories you do not need yet, `git init`, run lint.

**Existing project:** see `procedures/adopt-existing.md`. The short version — inventory what
exists before writing anything; distil rather than copy; verify every inherited claim against
the live system before carrying it forward; keep the old folder as a read-only archive rather
than migrating it.

Do not port a stale decision into a fresh package without checking it. Adoption is the moment
you find out what was already wrong — that is most of its value.

---

## 13. Conformance

A conforming nytka project:

1. has `project.yaml` with `schemaVersion`, `id`, `name`, `status`
2. has `AGENTS.md`
3. gives every markdown file (except `README.md` and pointer files) frontmatter with a
   non-empty `type`

A conforming consumer **must not** reject a project for unknown keys, unknown `type` values,
broken cross-links, missing optional files, or frontmatter fields it does not recognise.

---

## 14. Prior art

Nytka is an assembly, and the parts are better documented in their sources:

- **Open Knowledge Format** (Google Cloud) — the provenance vocabulary: `type`, `generated`,
  `verified`, `status`, `stale_after`, `sources`, the actor convention, derived trust tiers,
  and the liberal-conformance rule. Nytka uses a subset and adds `confidence` and the
  supersede pair. OKF's Attested Computations are out of scope here but are the right model
  for any project where an agent reports numbers it computed.
- **Karpathy's LLM wiki** — the three-layer split (immutable sources / agent-owned wiki /
  schema file) and the ingest–query–lint operations.
- **ADR practice** (Michael Nygard) — numbered, immutable, supersede-only decisions.

Deliberately **not** adopted: knowledge graphs derived from source code. They answer
structural questions about code, while the questions that decay in a project are about the
world outside it — prices, regulations, what the client approved. A derived code graph is a
dataset with a short shelf life, not project knowledge.
