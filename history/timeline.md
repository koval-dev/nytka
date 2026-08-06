---
type: History
title: Timeline
description: Meaningful changes to nytka, newest first — pruned out of current-state.md
status: draft
generated: { by: claude-opus-5, at: 2026-07-31 }
verified:
  - { by: claude-opus-5, at: 2026-07-31, against: current-state.md@b7bf737 }
confidence: stated
---

# Timeline

Pruned from `current-state.md` on 2026-07-31, verbatim. `current-state.md` keeps the recent
few and stays short; everything that stopped being *current* lives here.

Newest first.

---

- **2026-07-31** — **the format gained a procedure for interrupting a human**,
  [ask-the-owner](../procedures/ask-the-owner.md). The trigger was the owner's, in their words: a
  million questions and no algorithm for finding answers, arriving as pages of prose citing
  ticket numbers. Two failures sit behind that and only the second gets attention. The first is
  volume — an agent asks what `SPEC.md` already answers, or what P6 says to decide and record.
  The second is shape.

  The structural cause is an asymmetry rather than a wording habit: an agent accumulates context
  all session and the owner does not, so every question is asked from a position of much more
  context than the person answering it has. That is what losing control of a project feels like
  from the inside — being asked to arbitrate details whose origin you never saw. Hence two rules
  that are not about phrasing: a question must rebuild its own context in one sentence, and it
  must arrive **before** the work rather than after, because afterwards it is an approval
  request whatever its punctuation.

  The anchor that makes it nytka's rather than generic advice is that the format already names
  the only three points where a human is structurally required — `acceptedBy` leaving `proposed`,
  criteria checked leaving `review`, and a decision when an `unresolved.md` trigger fires. A
  question mapping to none of the three is almost always already answered or cheap enough to
  decide. The short form ships in `templates/project/AGENTS.md`, because this repo is referenced
  and not installed, so a scaffolded project would otherwise never see it.

  It was used the same hour it was written: the two tasks sitting in `review` were put to the
  owner as two questions with costed options, and both closed.

- **2026-07-31** — **`task-blocked-consistency` earned its keep twice in one session, unprompted.**
  Closing the lifecycle work left three tasks saying `blocked` with nothing open in `blockedBy`,
  and the check said so before anyone looked. On the third — TOOL-006 — it exposed a real error
  in a note written the day before, which had predicted this moment and concluded there would be
  nothing to put in `blockedBy`. There was: criterion 3 waits on ADOPT-001, in the same registry.
  The format gap 0008 recorded is therefore narrower than it was written up as — not "a task
  waiting on a condition", but "a task waiting on work in another repo", which is the second time
  that shape has come up this week.

  Under [0008](../decisions/0008-lint-check-rules.md) rule 3 this does **not** move the check toward
  `error`: same registry, so one origin however many times it fires.

- **2026-07-31** — **the rules for adding a lint check left a task's `context` field and became
  [0008](../decisions/0008-lint-check-rules.md)**, now `stable`. Four rules had been
  articulated in a session on 2026-07-29 and written down in exactly one place: the context field
  of the task asking for them to be written down somewhere else. The cost was not hypothetical — a
  check shipped at `error` on 2026-07-30, which rule 3 forbids, and was demoted the same day.
  Nobody adding it could have read the rule it broke.

  **Rule 3 gained a definition, which is the part with teeth.** "Right in practice" had never been
  defined, and the first check to need it was right on two packages scaffolded from one template —
  two right answers, one observation. It now means four things at promotion: two correct findings
  from inputs that do not share an origin, one of them from somewhere nobody predicted, no
  outstanding false positive counted against the check *as it stands*, and nothing going red
  unexamined. No time-in-service bar, deliberately: the check that shipped wrong shipped wrong on
  evidence quality, not on youth, and elapsed time is easy to measure and measures nothing.

  **A fifth rule was added and a sixth was folded in.** Rule 5 — a check must not fire on work that
  was correct when it was done — is not derivable from the other four: the required-field checks
  would be correct by their own logic on every task they flagged and wrong under §8 on every one of
  them, because those fields bind at the transition. The ceiling (the clause being enforced can cap
  a check below what rule 1 allows, as §8 does at `info` for the alias check and §13 does below
  `error` for any unknown value) became a clause of rule 1 rather than a rule of its own, because
  rule 1 is what answers "what level?" and two rules answering one question is P2.

  **Writing them down made two things already written wrong.** §8 cited §10 for a procedure §10 did
  not state: §10 said a check earns `error` by having been right in practice, about *one* check, and
  never that a check enters below `error`. That is the same shape as the miscitation
  [0006](../decisions/0006-task-lifecycle.md) exists to fix, this time inside the spec rather than
  downstream of it — §10 now states the rule generally, which makes §8's citation true, with no
  link out because SPEC.md has none. And rule 1 as articulated described three of lint's five error
  checks: `required-file` and `missing-type` are errors because §13 *requires* those things, not
  because anything contradicts itself. The code drew the boundary correctly for a week while the
  rule stated by its authors did not.

  **The placeholder check still does not clear the bar** (TOOL-006, still `blocked`). Two of its
  four criteria are met; it has no catch outside the template that prompted it, promoting it would
  turn two live packages red on placeholders nobody has answered, and clause 3 catches a live false
  positive nobody had noticed: markdown lets a code span wrap across a newline and the stripper's
  span pattern excludes newlines, so a wrapped span is read as prose. The first thing the bar did
  was disqualify the check it was written for.

- **2026-07-31** — **six borrowed execution fields were weighed for §8 and all six were
  rejected**, as [0007](../decisions/0007-execution-fields-stay-out-of-the-task-record.md) (`draft`,
  awaiting the owner). `complexity`, `executionMode`, `guardrails`, `validationCommands`,
  `requiredContext` and a runnable `verification.command` on an acceptance criterion came from a
  task-management skill written independently of this spec — the same skill whose status enum is
  the convergence evidence §8 cites for keeping `todo`. Nothing was added to the format.

  The rejections are worth more than an adoption would have been, because the bar in
  `unresolved.md` — *"anything beyond that must earn its place with a named failure"* — had never
  been applied to a concrete set. Three of the six are duplicates of mechanisms nytka already has:
  `requiredContext` restates what §10's Query row and `nytka context <id>` assemble from a task's
  own links; `validationCommands` restates a criterion's own check, and **the two copies have
  already drifted inside the skill's shipped example**; `guardrails` has two normative homes,
  §11.3 and §6's Consequences, which a downstream note claiming it had "no nytka equivalent at
  all" had missed. The runnable command is the one that looked strongest and is not: **6 of the 11
  criteria in the skill's own worked examples carry no command at all**, and requiring one would
  narrow §8's "checkable by someone who was not in the conversation" to whatever a shell can
  express. Lint checks form, never truth, so there is nothing here to run it.

  **The finding that mattered most was about the evidence, not the fields.** The brief said the
  skill was not installed and that the work should proceed from a secondhand summary. It was
  installed. Reading it directly turned up a seventh execution field the summary had missed, an
  `expected` half to the verification shape, a `manual` verification type, and a validator whose
  opt-in `--fix` mode writes `complexity: 5` and `executionMode: autonomous` into any task lacking
  them — which defeats the "count what was filled in without prompting" trigger in
  `unresolved.md` for anyone who has run it. Writing *"a file I could not open"* into a public repo
  would have manufactured the exact unverifiable claim this format exists to flag. P3 applies to a
  task's own premise.

  **Then the record was checked against the schema a second time, and four of its own claims were
  wrong** — corrected in place on 2026-07-31, while it is still `draft`. The rubric has three
  context regexes, not two; one of its seven factors keys on `blockedBy`, a field nytka does have,
  so "every factor" was too strong; `requiredContext`'s resolvable-path share is two entries in
  twelve, not "roughly half"; and the validator's defaults are opt-in rather than automatic. Three
  of the four had made the argument sound better than the evidence supports. **The conclusions did
  not move — every rejection still stands** — but a record that rejects six fields for being
  unverifiable is exactly the record that has to survive its own check, and the first pass did not.

- **2026-07-30** — **§8 names a task lifecycle, and the decision behind it settled against its
  own draft.** [0006](../decisions/0006-task-lifecycle.md) was confirmed by the owner and is stable.
  `ready` is canonical and `todo` is a **documented alias** read as `ready` — kept, not dropped,
  because a task-management skill written independently of this spec converged on
  `todo | in_progress | blocked | done`, and convergence from an unrelated direction is better
  evidence than the argument for renaming. `acceptedBy` is its own field rather than a reuse of
  `verified`: §5 derives trust tiers from `verified`, so merging them would have made every
  human-accepted task read as a claim someone had checked. §8 now carries the seven statuses,
  what moves a task between them, the fields each state requires, and the rule that those fields
  bind **at the transition** — so tasks closed before the lifecycle existed stay conforming and
  are not backfilled. `evidence` reconstructed from memory is the undated claim P4 exists to
  reject, and a rule that makes every existing registry non-conforming on the day it is published
  is how a spec teaches people to ignore it. The templates, `QUICKSTART.md` and two procedures
  teach the new vocabulary. This registry deliberately keeps `todo`: the vendored task commands
  treat only `todo` as startable, and renaming it here — tried in a scratch copy first — emptied
  the "Ready to start" pane and had `nytka next` report "nothing is ready" with two tasks ready,
  both exiting 0. The alias earned its keep on the day it was written.

- **2026-07-30** — **`templates/project/private/README.md` was kept here by nothing but the
  order it arrived in, and the repo that publishes this template lost the file to exactly that
  gap.** Line 1 of this repo's `.gitignore` is a bare `private/`, which matches the template
  directory of the same name. The file was tracked anyway, because it predates the rule —
  grandfathering, not design, and one `git rm --cached` from vanishing with nothing to say so.

  That is checkable rather than theoretical: `@nytka/cli` **0.4.0** on npm scaffolds a project
  with no `private/` directory at all, under an `AGENTS.md` stating `private/` is gitignored.
  The same ignore rule, in the repo that vendors this template, matched its copy — which was
  newer than the rule, so it was never tracked and never packed. `npm pack @nytka/cli@0.4.0`
  and read it. Fixed in **0.4.1**, published the same day.

  The fix here is one line after `private/`:

  ```
  !**/templates/project/private/
  ```

  It names the **directory**, not the README inside it. Git never descends into an excluded
  directory, so a negation naming the file re-includes nothing — verified in both directions
  with `git check-ignore -v --no-index` rather than assumed. The `**/` prefix is what lets the
  identical line hold wherever the template sits, at a repo root or nested under a package.

  This is the third distinct mechanism to delete the same directory from a published package.
  The first two were npm's: it will not publish a file named `.gitignore`, and it renames one
  inside a tarball to `.npmignore` on install. The pattern worth keeping is not any of the three
  — it is that each fix was followed by a test naming the file the *previous* mechanism took, so
  every one of them passed while the next mechanism shipped. That test is a whole-set diff now.

- **2026-07-30** — **`tools/` and the published CLI stopped being the same code, and stayed
  that way until 0.4.0 shipped later the same day.** `@nytka/cli` 0.4.0 was prepared and **not
  published** when this was written; it went out on 2026-07-30, followed by 0.4.1. The registry
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

- **2026-07-28** — decision [0006](../decisions/0006-task-lifecycle.md) drafted: tasks get a named
  lifecycle, and no task leaves `proposed` without a human `acceptedBy`. Confirmed by the owner
  on 2026-07-30 and in SPEC §8 the same day — see the entry at the top of this list.

- **2026-07-28** — the open question of where durable non-text files go, and how they carry
  provenance, was recorded in `unresolved.md`, raised by the first logo needing a home.

- **2026-07-27** — primary description changed from mechanism-first ("a directory layout, a
  frontmatter vocabulary, and three operations") to category-first ("project context for AI
  agents") in README, SPEC, `project.yaml` and the skill description. The old opener told a
  reader what nytka is made of before telling them what it is for.

- **2026-07-27** — tool wiring corrected and a launcher skill added ([0005](../decisions/0005-tool-integration-is-a-pointer.md)).
  The recommended `.codex/` pointer did not exist; Codex and opencode read root `AGENTS.md`
  directly, and only Claude Code needs a pointer. First case of the repo documenting wiring
  it had never checked.

- **2026-07-27** — nytka extracted from a real adoption: SPEC.md, the project template, four
  procedures, and a zero-dependency lint tool.
