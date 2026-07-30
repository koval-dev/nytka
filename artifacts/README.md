---
type: Reference
title: Artifacts
description: Raw assets this repo carries, and where they actually come from
status: draft
generated: { by: claude-opus-5, at: 2026-07-30 }
verified:
  - { by: claude-opus-5, at: 2026-07-30, against: kd-nytka-working-tree }
confidence: stated
---

# Artifacts

`index.json` is the registry. A binary cannot carry frontmatter, so the registry is the only
place a file's origin, date and status can live — **a file with no entry has no provenance and
should be treated as unknown.**

Payloads are committed here, unlike `datasets/`, because these files are small, durable and
canonical rather than large expiring evidence.

## Everything here is a vendored copy

The brand assets are canonical in `koval-dev/kd-nytka`, **which is private.** The copies here
are derived: replace them from there, and expect no reader of this repo to be able to check the
original. That is a real limitation of the provenance recorded below, not an oversight — see the
open question in [unresolved.md](../unresolved.md).

Normally a vendored copy is also read-only, because editing one is how an asset quietly forks.
Two departures from that, both deliberate and both recorded:

- **`nytka-logomark-sqr.svg` was renamed here on 2026-07-30** to correct a misspelling
  (`nutka`). The original still carries the old name, so this copy is knowingly ahead of it. The
  divergence is fine only until the original catches up; after that it is a fork nobody
  remembers making.
- **A defective asset is withdrawn, not repaired.** `nytka-logo-hor-nosafearea.png` was SVG
  content under a `.png` extension. It is not carried here and has no entry — an entry pointing
  at an absent file is worse than no entry. It returns when a real PNG is exported upstream.

Verified 2026-07-30: the four files carried here are byte-identical to their originals; only the
logomark's filename differs.

## Status values

`current` (use this one) · `superseded` (kept so an old copy in the wild can be identified) ·
`draft` (not approved for use).

## Open question

What `artifacts/` is *for* is not settled — SPEC §3 describes it as "outputs worth referencing",
and a logo is a durable **input** the project consumes. See
[unresolved.md](../unresolved.md) and the proposed task in
[tasks/tasks.yaml](../tasks/tasks.yaml). The entry shape used here follows the working rule in
`unresolved.md`, not a normative section, because there isn't one yet.
