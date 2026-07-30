# Agent instructions — nytka

Instructions for working **on** nytka itself. If you are looking for how to *use* nytka on a
project, read [SPEC.md](SPEC.md) or [QUICKSTART.md](QUICKSTART.md) instead.

## Which repo is this

**This repo holds rules only — no code, no packages, ever.** `SPEC.md`, templates, procedures
and `nytka-lint`. Its value is that it is readable with nothing installed; a build toolchain
here destroys that.

**Tools live in `koval-dev/kd-nytka`** — the CLI, plugins and connectors published as
`@nytka/*`.

**This repo is public. That one is private.** The packages it builds are public on npm, so
anyone can run them; its source is not readable, and neither is anything it records. Two rules
follow, and they are the reason this section exists rather than just naming the repo:

- **Never restate its internal state here.** Its decisions, task registry and working tree are
  not verifiable by anyone reading this repo, so a claim about them cannot be checked and cannot
  be corrected by a reader who spots it. Name the repo and the boundary; do not import its
  contents. A pointer is not a leak — a transcription is.
- **A public reader must never be sent somewhere they cannot go.** If a sentence would have
  someone open that repo to understand this one, the sentence is wrong. Point at npm, or at the
  vendored artefact here.

If you are about to add a package, a dependency or a build step here, stop — it belongs in
that repo. The full record lives there, as its decision 0006; do not restate it here.

### The rule that decides it

**If it needs to be installed, it ships from `kd-nytka`. If it only needs to be linked or
referenced, with no installation, it lives here.**

Stated by the owner on 2026-07-29 and recorded as that repo's decision 0009. Two lanes, two
people: someone who reads the philosophy and installs nothing, and someone who installs the
packages and wants a working command. Both must stay whole.

Apply it; do not re-argue it. `SPEC.md`, templates and procedures are referenced, so they stay
here. The next artefact that looks like it belongs to both lanes probably has a source and an
artefact that belong to different ones — which is exactly what happened to lint.

### Everything in `tools/` is generated

**Do not edit any of it.** The writable source is `@nytka/cli` in `kd-nytka`; these are
read-only copies, regenerated on release and checked by a drift test there. SPEC P2 permits
generated views on exactly those terms — one writable definition, synced in one direction.

```
tools/nytka.mjs        status · next · task · context · init · lint     ← run this one
tools/nytka-tasks.mjs  what those commands do
tools/nytka-lint.mjs   the format checks, also runnable directly
tools/nytka-yaml.mjs   the one YAML reader, shared by both
```

They stay committed, dependency-free and runnable under bare `node`, because a reader who
installs nothing must still be able to lint and to work a backlog. That property is what makes
vendoring possible at all, not politeness inherited from
[0003](decisions/0003-lint-zero-dependencies.md).

**They import each other by relative path, so keep them together.** Recorded as that repo's
decision 0010, which traded a one-file rule for a single shared parser — until 2026-07-30 lint
and the task commands each had their own, and the two disagreed. A relative import needs no
`node_modules`, so the zero-install promise is unchanged; copying one file out of the four is
what breaks now.

Or install it and skip all of this: `npm i -g @nytka/cli`, then `nytka status` in any project.

The file's own header says all of this. This section exists because the header is only read by
someone who already opened the file.

## Reading order

1. `SPEC.md` — the format. Normative and self-contained.
2. `current-state.md` — what is being worked on
3. `decisions/` — why nytka is shaped the way it is
4. `unresolved.md` — what is deliberately unsettled

Do not auto-scan `adopters/` or `templates/`.

## The one rule that matters most

**Nytka is described by SPEC.md, and SPEC.md is a single self-contained file.**

The product is "paste one link and the agent knows the format". Splitting the spec across
files breaks the only feature that makes it worth using. Deep-dives may exist alongside it,
but SPEC.md must stay complete on its own.

## The second rule

**Nytka manages itself under its own rules.** This repo is a nytka package. If a rule is
annoying to follow here, that is a bug report about the rule, not an exception to it.

When something in the spec turns out to be impractical, record it in `unresolved.md` or
supersede the decision — do not quietly stop following it in this repo.

## Changing the format

Any change to the frontmatter vocabulary, directory contract or conformance rules is a
**decision**. Write the record before the change.

Weigh these in order:

1. **Does it survive contact with a real project?** Every field must have a failure it
   prevents that actually happened. Speculative fields are how formats die.
2. **Can an agent follow it without tooling?** If it needs a parser or a linter to be usable,
   it is too complex. Lint is a convenience, not a dependency.
3. **Does it break existing packages?** Liberal conformance (SPEC §13) means consumers ignore
   unknown keys — so additive change is cheap, renames are not.

Bias to **removing** rather than adding. The spec is already at the edge of what someone will
read in one sitting.

## Borrowed conventions

The provenance vocabulary is a deliberate subset of Google Cloud's Open Knowledge Format; the
operations come from Karpathy's LLM wiki pattern; decisions follow ADR practice. Credited in
SPEC §14.

**Do not silently diverge from OKF field names.** Compatibility is a feature — an OKF-aware
tool should be able to read nytka frontmatter. Divergence needs a decision record saying why.

## The lint tool

`tools/nytka-lint.mjs` has **zero dependencies** and must stay that way. It is often the
first thing someone runs; `npm install` before first value is a bad trade.

It parses only the nytka frontmatter subset — that limitation is deliberate and documented in
the file header. If the vocabulary needs syntax the parser cannot handle, that is an argument
against the syntax.

Lint checks **form, never truth**. Do not add checks that pretend to verify facts.

Changes to lint's behaviour are made in `kd-nytka` and arrive here as a regenerated file — see
above. What belongs here is lint's *documentation*: [procedures/lint.md](procedures/lint.md),
the rules for what may become an error, and the worked examples. Rules are referenced;
implementations are installed.

## Documentation voice

Concrete over abstract. Every rule should name the failure it prevents, ideally one that
actually happened in a real project — described generically, never attributed.

Avoid framework-marketing register. The audience is one person setting up a project at
11pm and an agent parsing it.

## Secrets and scope

**This repo is framework source only.** No credentials, no client or company data, no project
names, no real business context. Failure examples that motivate a rule are described
generically and never attributed — real project context belongs in that project's own
private repo.

## Before finishing

```bash
node tools/nytka-lint.mjs .
```

Zero errors. Nytka failing its own lint is the least defensible bug available.

**Then reconcile `tasks/tasks.yaml` against what actually changed.** Any task whose context is
now false, or whose acceptance criteria are met, is updated in the same commit as the work.

This step is manual because it has to be: lint reads markdown frontmatter and does not open the
registry, so a green lint run says nothing about whether the backlog is true. The failure is not
hypothetical — the task for publishing this repo sat at `todo`, asserting "the repo exists but is
private", for a day after the repo went public, through a clean lint and an accurate
`current-state.md`. Both entry points were right and the backlog was wrong, which is the exact
shape of rot the format exists to make visible.
