---
type: Decision
title: Borrow OKF's vocabulary rather than invent one
status: stable
verified: [{ by: "human:mike", at: 2026-07-27 }]
confidence: stated
supersedes: null
superseded_by: null
---

# 0002 — Borrow OKF's vocabulary rather than invent one

## Decision

The provenance frontmatter — `type`, `status`, `generated`, `verified`, `sources`,
`stale_after`, the actor convention, derived trust tiers, liberal conformance — is taken as a
subset of Google Cloud's Open Knowledge Format. Nytka adds only `confidence` and the
`supersedes` / `superseded_by` pair.

## Reason

The alternative was inventing field names, then defending them. OKF already solved the part
nytka needed — distinguishing an agent-generated claim from a human-verified one — and it is
published, versioned and readable by other tooling.

The derived trust tier (unverified / machine-confirmed / human-reviewed) is the specific
thing worth borrowing. It addresses the failure that motivated nytka: in plain markdown, a
generated guess and a client-confirmed fact are indistinguishable.

## Consequences

- Nytka frontmatter should stay readable by OKF-aware tooling. Silent divergence from OKF
  field names is a bug; deliberate divergence needs its own decision record.
- OKF features nytka has no use for are **not** adopted. Attested Computations are the main
  example — the right model for agent-reported numbers, but no current adopter computes any.
- OKF is young and already made breaking changes v0.1 → v0.2. Nytka tracks names, not
  releases, and will not rename fields just because upstream did. Tracked in `unresolved.md`.
