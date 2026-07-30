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

The brand assets are canonical in `koval-dev/kd-nytka`, under that repo's decision 0005. The
copies here are **derived and read-only**: replace them from the hub, never edit them in place.
Editing a vendored copy is what turns it into a fork — which is why the misspelled
`nutka-logomark-sqr.svg` keeps its name here rather than being corrected locally. The fix
belongs upstream, and arrives as a re-vendored file.

A defective asset is withdrawn, not repaired. `nytka-logo-hor-nosafearea.png` was SVG content
under a `.png` extension; it is not carried here and has no entry, because an entry pointing at
a file that is not present is worse than no entry. It returns when the hub exports a real PNG.

Verified 2026-07-30: all four files are byte-identical to their hub originals.

## Status values

`current` (use this one) · `superseded` (kept so an old copy in the wild can be identified) ·
`draft` (not approved for use).

## Open question

What `artifacts/` is *for* is not settled — SPEC §3 describes it as "outputs worth referencing",
and a logo is a durable **input** the project consumes. See
[unresolved.md](../unresolved.md) and the proposed task in
[tasks/tasks.yaml](../tasks/tasks.yaml). The entry shape used here follows the working rule in
`unresolved.md`, not a normative section, because there isn't one yet.
