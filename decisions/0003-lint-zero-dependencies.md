---
type: Decision
title: Lint ships with zero dependencies
status: stable
verified: [{ by: "human:mike", at: 2026-07-27 }]
confidence: stated
supersedes: null
superseded_by: null
---

# 0003 — Lint ships with zero dependencies

## Decision

`tools/nytka-lint.mjs` has no dependencies and runs on stock Node. It includes a hand-rolled
parser covering only the nytka frontmatter subset.

## Reason

Lint is usually the first thing someone runs against a new package. Requiring `npm install`
before any value is delivered is a bad trade for a tool whose whole pitch is low friction.

The parser limitation is a feature: if the vocabulary ever needs syntax the simple parser
cannot handle, that is an argument against the syntax, not for a YAML dependency.

## Consequences

- Frontmatter must stay within: scalars, inline `{a: b}` maps, inline `[a, b]` lists, and
  `- ` list items. No block-nested structures, no anchors, no multi-line strings in
  frontmatter.
- Lint checks **form, not truth**. It can report that a claim is expired or unverified, never
  that it is wrong. Project-specific checks that query live systems belong in the project.
- If a future check genuinely needs full YAML, it goes in a separate optional tool. This one
  stays dependency-free.
