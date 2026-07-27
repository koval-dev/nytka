---
type: Unresolved
title: Open questions on the weave format
status: draft
generated: { by: claude-opus-5, at: 2026-07-27 }
---

# Unresolved questions

Each has a **working rule** so work continues, and a **decision trigger**. A working rule is
not architecture — do not cite one as a decision.

---

## Is the frontmatter vocabulary worth its cost?

**Status:** open

Every field is justified by a failure that actually happened on a real project — but that is
one project, and the person writing the frontmatter is usually the person who already knows
the answer. The cost is paid on every file; the benefit arrives months later.

**Working rule:** keep `type`, `status`, `generated`, `verified`, `confidence`, `stale_after`.
Anything beyond that must earn its place with a named failure.

**Decision trigger:** after the second adopter, count how many fields were actually filled in
without prompting. Drop the ones that were not.

---

## Should weave ship a `query` tool, or stay a format?

**Status:** open

The spec defines three operations but only ships one tool (lint). `ingest` and `query` are
procedures an agent follows — which is arguably correct, since agents are the runtime.

**Working rule:** format and procedures only, plus lint. No retrieval layer, no index, no
embeddings.

**Decision trigger:** if a package grows past roughly 100 documents and agents start missing
relevant files, reconsider. Below that, a directory listing is the index.

---

## How does weave handle multiple projects?

**Status:** open

The spec covers one project. The original motivation was several clients sharing components
and procedures. Nothing yet describes a portfolio, or how two projects share a procedure
without copy-paste.

**Working rule:** copy shared procedures between projects, and accept the drift. Copying is
honest; a shared-include mechanism that nobody maintains is not.

**Decision trigger:** the third adopter, or the first time a copied procedure diverges in a
way that causes a real mistake.

---

## Should `stale_after` be required?

**Status:** open

It is the field that makes lint useful, and the field most likely to be omitted. Requiring it
would force a judgment on every document; making it optional means most documents never get
one and lint stays quiet about them.

**Working rule:** required for anything describing an external system, optional otherwise.
Lint warns rather than errors.

**Decision trigger:** if a stale claim causes a real mistake in a package where lint was
clean, make it required.

---

## Does the OKF subset stay a subset?

**Status:** open

Weave borrows OKF's vocabulary and adds `confidence` and the supersede pair. OKF v0.2 already
made breaking changes to v0.1 (`timestamp` → `generated`, body citations → structured
`sources`). If it keeps moving, weave either follows and breaks packages, or diverges and
loses the compatibility argument.

**Working rule:** track OKF field *names* where they overlap; do not adopt OKF features weave
has no use for (Attested Computations). Never rename a weave field just because OKF did —
weigh the breakage.

**Decision trigger:** OKF v1.0, or the first weave-shaped need for attested computations
(likely a reporting client, not a content project).
