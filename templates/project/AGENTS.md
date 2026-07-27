# Agent instructions — <project>

Canonical instructions for any AI agent on this project. Most agent tools read this file at
the project root directly; where a tool needs its own (`CLAUDE.md`, `.cursor/rules/`), that
file is a **pointer** to this one, never a copy. Edit this one.

Format: https://github.com/koval-dev/weave

<!-- Keep this file under ~150 lines. Longer files get skimmed. -->

## Reading order

1. `project.yaml` — what exists and where
2. `current-state.md` — what is happening now (read every session)
3. `decisions/` — binding constraints; read before proposing an approach
4. The `procedures/` file for the work at hand
5. The task record

Do **not** auto-scan: `research/`, `history/`, `datasets/` payloads, archive folders.
Load those only when a task points at them.

<!-- The exclusions matter more than the order. An agent that reads everything
     every session burns its context on knowledge it does not need. -->

## The one rule that matters most

<!-- State the single most important project rule here, bluntly. If an agent reads one
     paragraph of this file, this paragraph should prevent the worst available mistake.
     Examples:
       "The CMS is the source of truth for content. Files are dated observations."
       "Never run a write query against the production database."
       "Client-facing numbers come only from the sanctioned report query."       -->

## Safety rules

<!-- What must never be modified without explicit confirmation. Be specific about
     the system, the action, and who confirms. -->

- Confirm before any write to <external system>.
- Never modify <thing the client owns> without per-item confirmation.

## Task state

Tracker mode is declared in `project.yaml → tasks.tracker`.

- **`file`** — `tasks/tasks.yaml` is authoritative. Set `status`, add `updated`, then check
  whether anything in `blockedBy` can move `blocked` → `todo`.
- **external tracker** — the tracker owns status. Update through it, never by editing a
  file. Generated snapshots are read-only; if they disagree with the tracker, the tracker wins.

Never maintain status in two places.

## Recording evidence

Any claim about external state carries a date and a source: `verified 2026-07-27 against <system>`.
An undated claim is unverified, regardless of how confident it sounds.

In frontmatter: `verified: [{ by: "human:<id>", at: <date>, against: <system> }]`.
Use `confidence: inferred` for anything you reasoned out rather than read.

## When to create a decision

Create a record in `decisions/` when a choice constrains future work — stack, schema,
policy, scope. Not for casual opinions or one-off task judgments.

Superseding means a **new** record plus `status: superseded` on the old one. Never edit an
accepted decision to change its meaning.

## Secrets

No credentials in this repo. `private/` is gitignored and holds references only. Never paste
a token into a file, a commit message, or a task description.

## Scope

<!-- What does not belong here. Usually: application code, which lives in the
     component repos declared in project.yaml. -->

## Before finishing

Run lint: `node <path-to-weave>/tools/weave-lint.mjs .`
