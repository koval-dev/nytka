---
type: Unresolved
title: Open questions on the nytka format
status: draft
generated: { by: claude-opus-5, at: 2026-07-27 }
---

# Unresolved questions

Each has a **working rule** so work continues, and a **decision trigger**. A working rule is
not architecture — do not cite one as a decision.

---

## Where do durable non-text files go, and how do they carry provenance?

**Status:** open

Raised 2026-07-28 by the first real case: a logo for the line itself, followed by the
observation that there will be many such files — screenshots, exported diagrams, vendor PDFs.

Two gaps, and the second is the structural one.

**`artifacts/` is undefined.** It appears twice in the whole repo: one line in `SPEC.md` §3
(*"outputs worth referencing"*) and one row in `procedures/ingest.md` (*"A completed output →
`artifacts/`"*). No section, no template directory, no rules — compare `datasets/`, which gets
§9 and a schema. And a logo is not an *output*: the format sorts things into knowledge
(`research/`), evidence (`datasets/`) and outputs (`artifacts/`), and has no category for a
durable **input** the project consumes. Left as is, `artifacts/` becomes the junk drawer.

**Nothing that is not markdown can carry provenance.** §5 requires frontmatter on markdown, and
the entire trust model — `verified`, `confidence`, `stale_after`, the derived trust tiers —
rides on it. A `.png` carries none of it, so a raw file in a folder is invisible to the format:
no source, no date, no way to tell whether it is current. This is not a documentation gap; it
is a hole in the thing the format exists to provide.

`datasets/index.json` is the one existing answer to *"a file that cannot describe itself"* —
but it was built for the opposite case. Payloads there are large, gitignored, expiring and
queried by script. A logo is small, committed, canonical and does not expire. The registry
shape transfers; the storage rule inverts.

**Working rule:** raw files go in `artifacts/` in the repo that uses them, with an
`artifacts/index.json` alongside carrying `id`, `file`, `summary`, `addedAt`, `source` and
`status` — the `datasets/index.json` shape, payloads committed rather than ignored. Purely
additive, so §13 liberal conformance keeps existing packages valid. A worked instance is in
`kd-nytka/artifacts/`, decided there as 0005.

**Decision trigger:** the second repo that needs the same asset, or the first time an agent has
to answer *"is this file current?"* about something with no frontmatter. Either fires during
FMT-003, which is where friction like this is meant to surface. Settle it before `RT-002`
builds a loader against whatever `artifacts/` turns out to mean.

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

## Should nytka ship a `query` tool, or stay a format?

**Status:** open

The spec defines three operations but only ships one tool (lint). `ingest` and `query` are
procedures an agent follows — which is arguably correct, since agents are the runtime.

**Working rule:** format and procedures only, plus lint. No retrieval layer, no index, no
embeddings.

**Decision trigger:** if a package grows past roughly 100 documents and agents start missing
relevant files, reconsider. Below that, a directory listing is the index.

---

## How does nytka handle multiple projects?

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

Nytka borrows OKF's vocabulary and adds `confidence` and the supersede pair. OKF v0.2 already
made breaking changes to v0.1 (`timestamp` → `generated`, body citations → structured
`sources`). If it keeps moving, nytka either follows and breaks packages, or diverges and
loses the compatibility argument.

**Working rule:** track OKF field *names* where they overlap; do not adopt OKF features nytka
has no use for (Attested Computations). Never rename a nytka field just because OKF did —
weigh the breakage.

**Decision trigger:** OKF v1.0, or the first nytka-shaped need for attested computations
(likely a reporting client, not a content project).
