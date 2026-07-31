---
type: State
title: Current state
description: What is happening on nytka right now
status: draft
generated: { by: claude-opus-5, at: 2026-07-29 }
verified:
  - { by: claude-opus-5, at: 2026-07-29, against: npm-registry }
  - { by: claude-opus-5, at: 2026-07-29, against: kd-nytka-working-tree }
  - { by: claude-opus-5, at: 2026-07-30, against: github-api }
  - { by: claude-opus-5, at: 2026-07-30, against: kd-nytka-working-tree }
  - { by: claude-opus-5, at: 2026-07-30, against: npm-registry }
confidence: inferred
---

# Current state

**Last updated:** 2026-07-30

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
  [0006](decisions/0006-task-lifecycle.md). Marked in progress since 2026-07-28, but nothing has
  moved on it or on 0006 since that date: it is **waiting on the owner** for two answers —
  whether `todo` is dropped for `ready`, and whether `acceptedBy` earns a field or reuses
  `verified`. The vocabulary in use has no status meaning "waiting on a human", which is part of
  what 0006 exists to fix.
- **TOOL-002** — write down the rules for adding a lint check. Now the larger half of what this
  repo owes lint: the implementation moved out under 0009, the rules did not. Rule 4 also
  unblocks the tasks.yaml checks in kd-nytka, which is the path to lint ever seeing the backlog.
- **SPEC-003** — `proposed`, not accepted: settle what `artifacts/` is now that its trigger has
  fired. Agent-proposed on 2026-07-30 and awaiting a human, per 0006's rule that nothing leaves
  `proposed` without one.

## Recent meaningful changes

- **2026-07-30** — **`tools/` and the published CLI stopped being the same code, and will stay
  that way until 0.4.0 ships.** `@nytka/cli` 0.4.0 is prepared and **not published**. The registry
  serves 0.3.1, and what that means is checkable rather than a guess — `npm pack @nytka/cli@0.3.1`
  and read it: the template it scaffolds from has no `.gitignore` and no `private/`, its lint has
  no `unfilled-placeholder` check, five of its commands reject `--json`, and its `task block` can
  leave a registry unparseable. All four are fixed in the files vendored here and in none of the
  bytes on npm. The visible consequence is that the two lanes disagree today: `node
  tools/nytka-lint.mjs` reports 7 warnings on a freshly scaffolded package where `npx
  @nytka/cli@0.3.1 lint` reports 1. `README.md` claimed those two "run the same checks, because
  they are the same code" — true of the source, not of what a reader can install this afternoon,
  and now corrected to say which. A vendored copy being ahead between releases is the normal state
  under 0009; a public file asserting the two are interchangeable is not.

- **2026-07-30** — **`nytka task block|start|done` could unparse the registry and print a success
  line over it.** Adding a field a task did not already carry inserted it *before* the block's
  last line rather than after it. Where a task ended in a nested list and the next one followed
  immediately — or a section-header comment did, with no blank line between — the new key landed
  inside that list, the file stopped parsing, and every task in it went invisible; `status` then
  reported an empty backlog through a command that had just said `A-1 -> blocked` and exited 0.
  This repo's own registry was never at risk: a blank line sits between every task here, and that
  is the shape the old code happened to get right. The fix that matters is not the corrected
  offset. Every edit now re-reads and re-parses the file, checks that the task it meant to change
  reads back as intended and that **every other task is byte-identical to its pre-image**, and on
  any mismatch restores the bytes it started from and exits non-zero. Worth recording here rather
  than only where the code lives, because it is the failure this whole format exists to prevent,
  committed by the tool that reads the format: not a wrong answer, a wrong answer wearing a
  success line.

  One defect surfaced from that guard and was left in on purpose. The field edit matches the first
  `key:` at any depth, so a task with no top-level `status` but a `status` nested inside `workLog`
  gets the `workLog` rewritten. Neither live registry has that shape, and narrowing the match
  would change which line every edit targets, including all the ones that are currently correct.
  Carried knowingly: the guard turns it from silent damage into a loud refusal, which is the trade
  worth taking while the narrower matcher is unproven.

- **2026-07-30** — **the task commands stopped contradicting their own help text, in three
  places.** `nytka status|next|task|context|init --json` hard-errored with *unknown option
  --json* while `--json   Machine-readable output. Every command supports it` sat one screen
  above it in the same `--help`. Five commands refused the flag where `lint`, `check` and `info`
  answered it — wrong since 0.2.0, and still wrong in what npm serves today. All five answer
  now, and the shape is one contract instead of five
  per-command projections, because the consumers it is for (a tracker provider, an adapter, an
  agent running `next --json` to pick work) have to hand the same record to each other: SPEC §8's
  ten fields first and always present — absent scalar `null`, absent list `[]` — then every extra
  key the registry declares, then `actionable` and `waitingOn` assigned **last**, so a registry
  that happens to use either name cannot shadow the computed answer. The help text stopped
  overclaiming too: "Every command but help supports it". Two smaller lies went with it.
  `--x=y` was taken on trust, so `--stats=todo` set a key nobody read and the command listed the
  whole backlog as though no filter had been asked for, while the spaced form had always rejected
  an unknown name. And `process.exit()` abandons a pipe that has not drained: `nytka context <id>`
  produces 20 KB here and was handing any programmatic reader everything up to roughly 8 KB of it,
  with exit 0. `nytka-lint --json` had the same defect. Both set `process.exitCode` now and let
  node leave on its own. One family, three instances: the exit code said the answer was complete.

- **2026-07-30** — **the secrets discipline was the one part of the template that never shipped.**
  npm refuses to publish a file named `.gitignore` *and* reads it as pack instructions on the way
  out, so the template's own `private/` rule removed `private/` from the tarball while the
  `.gitignore` removed itself: 14 of 16 template files published. Every project scaffolded with
  `npx @nytka/cli init` arrived with no gitignore and no `private/`, under an `AGENTS.md` still
  saying "`private/` is gitignored" — a false claim about where secrets are safe, and the reason
  kd-agency has neither. The first fix was `templates/project/.npmignore` (`!.gitignore`), which
  overrides the ignore source and puts the file back in the tarball, and it was argued at the time
  that no rename was needed. **That held for a little over an hour — see the entry below.** Same
  failure family as 0.3.0's missing `templates/` in `files`: correct in the working tree, silently
  wrong from the registry. The test now asserts against the tarball and fails without the fix.

- **2026-07-30, later** — **npm mangles `.gitignore` in *both* directions, and the first fix only
  covered one.** It refuses to publish a file by that name; it also renames any `.gitignore` it
  finds in a tarball to `.npmignore` **on install**. The `.npmignore` fix above cleared the first
  hurdle and lost to the second, so a package installed from the registry still had no gitignore
  to scaffold from — the same user-visible failure, one step further down the pipe, and invisible
  to a test that stops at the tarball. The template now carries the file **undotted** as
  `templates/project/gitignore`, a name npm has no opinion about in either direction, and `init`
  writes it out dotted. `.npmignore` is deleted; it has nothing left to override.
  This is the rename the earlier entry talked itself out of, and the cost it predicted is real:
  `cp -R templates/project` now hands you a file called `gitignore` that git does not read, so on
  the manual path `private/` is untracked-but-unignored until someone renames it. That is a worse
  trap than the `.npmignore` it replaces, because nothing prints and nothing checks —
  `procedures/init-project.md` now warns about it in the step where the choice is made. The lesson
  is not "rename sooner". It is that the fix was verified against the artefact that was broken
  (the tarball) rather than against the thing anyone actually wanted (a scaffolded project with a
  working gitignore), and those came apart one npm behaviour later.

- **2026-07-30** — **`init` now ends at a lint report rather than at "files exist".**
  `templates/project/AGENTS.md` shipped `node <path-to-nytka>/tools/nytka-lint.mjs .`, a
  placeholder no step ever substituted. It reached two real projects and surfaced only when an
  agent could not resolve it, invented `scripts/nytka-lint.mjs`, and ran that. The cause was not
  the missing substitution but that nothing downstream could tell a scaffolded package from a
  finished one — `init` closed by *printing advice*, and lint had no opinion. Fixed in three
  places: the line has no parameter left in it (`nytka lint .`), `nytka init` derives the
  `AGENTS.md` title and `project.yaml → id` from the directory name and lints what it wrote, and
  lint gained `unfilled-placeholder` and `template-comment`, both **warn**. The check is scoped
  to prose: angle brackets inside a code span or fence are how the templates document their own
  formats, and a check that flagged those would be muted within a week. Publishing is now gated
  on the vendor drift check via `prepublishOnly`, which was previously a thing to remember.
  `unfilled-placeholder` shipped as an `error` and was demoted the same day: TOOL-002 rule 3
  says a new check enters as info or warn, and being right on the two projects that prompted it
  is one observation rather than two, since both came from the same template.

- **2026-07-30** — **the backlog was reconciled, and the gap that let it rot was closed.** The
  task for publishing this repo still read *"the repo exists but is private"* a day after the
  repo went public — through a clean lint and an accurate `current-state.md`. Cause: `nytka-lint`
  does not read `tasks/tasks.yaml`, the registry is YAML so no task can carry `verified` or
  `stale_after`, and `procedures/ingest.md` had **no row routing anything to tasks**. Three of
  the format's four honesty mechanisms skipped the backlog entirely. Ingest now has the row, and
  `AGENTS.md` ends with a manual reconcile until lint can see the registry — which is blocked in
  kd-nytka on this repo writing lint's four rules down.

- **2026-07-30** — **the public/private boundary is now stated, and it is a format problem, not
  just an editing rule.** This repo is public; the tools repo is private. Nothing said so, and
  the consequences had already landed: `README.md` sent readers to a repo that 404s for them, and
  a day of reconciliation work had transcribed that repo's internal state — task IDs, registry
  contents, file counts — into public files, where no reader can verify or correct any of it.
  `AGENTS.md` now carries the two rules that follow (name the boundary, never import the
  contents; never send a public reader somewhere they cannot go), and the transcriptions are
  removed. The format gap this exposed is in `unresolved.md`: provenance whose source the
  audience cannot open is honest and permanently uncheckable, and the trust tiers have no way to
  say so — `verified` means "someone checked", never "and you cannot".

- **2026-07-30** — **`artifacts/` is in real use here and now has a registry.** Brand assets live
  in `artifacts/logo/` as vendored copies of originals canonical elsewhere.
  `artifacts/index.json` and a README carry their provenance, following the working rule in
  `unresolved.md` rather than any normative section — there isn't one. Two upstream defects
  surfaced. The defective PNG was **withdrawn** rather than repaired and returns when a real one
  is exported upstream; the misspelled logomark was **renamed here**, ahead of its original,
  which knowingly diverges this copy from it. Both fixes are tracked in the repo that owns the
  originals.

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
  tooling, not an adopting project. Agent-reported numbers are still untested, and the wait
  continues. `artifacts/` is no longer on that list — see below.

## Verified snapshots

| Claim | Value | Verified | Against |
|---|---|---|---|
| Repo is public and the raw SPEC.md URL resolves | yes | 2026-07-30 | `gh repo view` + `curl` → 200 |
| Brand assets here match the hub byte for byte | yes, all 4 registered — the logomark under a corrected filename | 2026-07-30 | md5 across both working trees |
| Lint reads `tasks/tasks.yaml` | **no** | 2026-07-30 | source — 0 occurrences of "tasks" |
| Adopters in production | 1 project + 1 tooling line (8 published packages) | 2026-07-29 | npm registry |
| Lint runs clean on itself | yes — 0 errors, 0 warnings, 0 info, 19 documents | 2026-07-30 | `node tools/nytka-lint.mjs .` |
| A freshly scaffolded package reports its own blanks | yes — 0 errors, 7 warnings | 2026-07-30 | `nytka init` into a temp dir |
| Lint dependencies | 0 | 2026-07-27 | source |
| `tools/` is four generated copies | yes — lint and the task commands both regenerated 2026-07-30, so `tools/` is **ahead of published 0.3.1** until 0.4.0 ships | 2026-07-30 | file headers + the source repo's drift check |
| `npx @nytka/cli lint` runs the same checks | **not today** — 7 warnings here against 1 from 0.3.1, same directory | 2026-07-30 | both run against a fresh `init` scaffold |
| The task commands answer `--json` | yes in `tools/`; published 0.3.1 rejects the flag on five of them | 2026-07-30 | both run against this repo |
| Published connectors | 6 (`gsc` 0.3.3, `ga4` 0.2.3, `sanity` 0.3.2, `gtm` 0.1.2, `dataforseo` 0.1.3, `ads` 0.1.1) | 2026-07-29 | npm registry |
| Published runtime | `@nytka/cli` 0.3.1 — **0.4.0 is prepared and unpublished**; `@nytka/core` 0.1.0 as of 2026-07-29, not re-checked | 2026-07-30 | `npm view @nytka/cli version` |
| What installing 0.3.1 still gets you | a template with no `.gitignore` and no `private/`, no `unfilled-placeholder` check, `--json` refused, and a `task block` that can unparse a registry | 2026-07-30 | `npm pack @nytka/cli@0.3.1` and read it |
| A connector has run against a live external system | yes, for five of six | 2026-07-29 | development repo's `current-state.md` |

## Next deadline

None. Nytka is a tool for other work, not a deliverable.
