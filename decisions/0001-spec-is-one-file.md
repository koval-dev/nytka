---
type: Decision
title: SPEC.md is one self-contained file
status: stable
verified: [{ by: "human:mike", at: 2026-07-27 }]
confidence: stated
supersedes: null
superseded_by: null
---

# 0001 — SPEC.md is one self-contained file

## Decision

The normative specification lives in a single file, `SPEC.md`, complete on its own. Deep-dive
documents may exist alongside it, but the spec is never split across them.

## Reason

The product is "paste one link into any agent and it knows the format". An agent given a URL
fetches one document. A spec split into `spec/00-concepts.md` … `spec/08-operations.md` is
better to maintain and useless for the only feature that makes weave worth adopting.

Maintainability of the spec is a cost paid by one person. Fetchability is a benefit paid to
every user, every session.

## Consequences

- SPEC.md is long and will get longer. That is accepted.
- When it stops being readable in one sitting, the answer is to **cut**, not to split.
- README and QUICKSTART duplicate small parts of it. Duplication in entry points is fine;
  duplication in normative text is not — SPEC.md wins on any conflict.
