# Agent instructions — nytka

Instructions for working **on** nytka itself. If you are looking for how to *use* nytka on a
project, read [SPEC.md](SPEC.md) or [QUICKSTART.md](QUICKSTART.md) instead.

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
