---
type: Decision
title: "`artifacts/` holds the project's non-markdown files, input or output"
status: stable
verified: [{ by: "human:mike", at: 2026-07-31 }]
confidence: stated
supersedes: null
superseded_by: null
---

# 0010 — `artifacts/` holds the project's non-markdown files, input or output

## Decision

`artifacts/` is defined in SPEC §3: the files a project owns that cannot carry frontmatter,
consumed or produced. Provenance lives in `artifacts/index.json`; a file with no entry is legal
and reads as unknown provenance. `datasets/payloads/` is named in §9 as where a payload lives.

The working rules that were already running in two repos and six connectors are promoted
verbatim. Nothing new was designed.

## Reason

Three entries in `unresolved.md` were circling one gap, and none of them was going to be settled
by more thinking: the answer had been in use since 2026-07-28 and was working. What kept them
open was that this repo authors the format, so every ordinary use of it — adding a logo — also
read as a specification question and cost a decision-shaped amount of work. Four SVGs produced
roughly 160 lines of metadata across three files.

That tax is not the format's; it is this repo's, and it does not transfer to an adopting
project. Closing by fiat on evidence already collected costs less than a fourth case would, and
leaving `artifacts/` undefined was making the cheap path — drop the file in — feel illegal.

The "a file with no entry is legal" clause is the load-bearing one. Requiring the entry first
makes the registry the gate on adding a file at all, and the cheapest way past a gate is to put
the file somewhere else.

## Consequences

- `artifacts/` is no longer the least specified directory in the format. A loader may be built
  against it.
- An `artifacts/index.json` that exists and is empty still says nothing rather than "nothing
  here". Lint gains no `artifacts/` check under [0008](0008-lint-check-rules.md) rule 3 — there
  is no failure to point at yet.
- A mutation record is an output and lands here. If the first real mutation run does not fit,
  that run is the evidence for a category and this record gets superseded.
- `vendored:` in a `source` value is now specified rather than a convention this repo invented.
- One thing is *not* closed: provenance whose canonical original sits behind a visibility
  boundary is still unexpressible — `verified` can say "someone checked" and cannot say "and
  you cannot". That stays in `unresolved.md`.
