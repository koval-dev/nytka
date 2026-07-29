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
to answer *"is this file current?"* about something with no frontmatter. Settle it before a
loader is built against whatever `artifacts/` turns out to mean.

The trigger previously named FMT-003 — the hand-run gate — as where this friction would
surface. That gate was removed and FMT-003 closed on 2026-07-28; friction now surfaces in the
work that hits it, which is what the three entries below are.

---

## Is there a category for collected data that is registered but never read?

**Status:** open

Raised 2026-07-28 by the first connectors, which had nowhere in the format to put what they
collected.

`datasets/` and its `index.json` are specified (§9) and the registry works. What is not
specified is where the **payload** goes — the raw API response a connector fetched, which may
be megabytes, is regenerable, expires, and must **never** be loaded into an agent's context.
The spec's categories all assume something is meant to be read: `research/` is knowledge,
`artifacts/` is outputs, `datasets/` is evidence a human or agent consults.

`datasets/payloads/` was invented outside this repo to hold it, along with the rule that a
payload is registered and queried by script but never read into context. That rule is doing
real work and is written down nowhere normative.

**Working rule:** payloads go in `datasets/payloads/`, gitignored, registered in
`datasets/index.json`, and never loaded into an agent's context. The registry entry — not the
payload — is what a reader consults.

**Decision trigger:** the second independent implementation of a connector, or the first time
an agent loads a payload into context because nothing told it not to. Additive either way, so
§13 liberal conformance holds.

---

## Does `datasets/index.json` have a serialisation contract?

**Status:** open

A registry meant to be reviewed by humans in diffs has a formatting contract, and §9 does not
state it. Found 2026-07-28: a connector appending one entry with a plain
`JSON.stringify(x, null, 2)` reformatted all five existing entries, turning 78 lines into 97
and making the diff unreviewable. The fix was a width-calibrated formatter, written per
implementation because nothing specifies the target.

This is small and it is not cosmetic. The file's value is that a human can see what changed;
a writer that reflows the whole file destroys that on every append, and every independent
implementation will rediscover it.

**Working rule:** an appending writer must not reformat entries it did not touch. Match the
existing file's shape rather than re-serialising it.

**Decision trigger:** the second independent writer of `index.json`. Either §9 gains a stated
shape, or the rule stays "preserve what you did not touch" and says so.

---

## Where does a record of an external mutation live?

**Status:** open

The format is built around **collecting**: `datasets/` with `collectedAt` and `validUntil`,
provenance describing what was read and when. It has no shape for *"an agent changed something
in a system outside this repo — here is the before state, the after state, and what is needed
to reverse it."*

Raised 2026-07-28 when the first write-capable connector was specified. The nearest fit is
`artifacts/`: a mutation record is an output, but one whose entire value is auditability, which
is not what `artifacts/` was described for. Registering it in `datasets/` would be worse — a
change is not an observation, and it has no payload and no validity window.

This compounds with the first question above. `artifacts/` is already the least specified
directory in the format, and it is now the proposed home for two unlike things.

**Working rule:** `artifacts/`, carrying the before state, the after state, and the identifier
needed to reverse the change.

**Decision trigger:** the first mutation run against a real external system. If `artifacts/`
carries it comfortably, this closes as a note in SPEC §3; if it does not, the format needs a
category and that run is the evidence for it.

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
