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

## Can provenance name a source the reader cannot open?

**Status:** open — the one part of the `artifacts/` question
[0010](decisions/0010-artifacts-holds-non-markdown-files.md) did not close

The brand assets in `artifacts/` are canonical in a private repo, so their `source` names
something no reader of this public repo can check. The claim is honest and permanently
unverifiable by its audience, and the trust tiers have no way to say so: a `verified` entry
means *someone checked*; it cannot mean *and you cannot*. Same shape wherever a package is
public and its evidence is not — a client's analytics account, an internal wiki, a paid API.

**Working rule:** state the source accurately even when it is unreachable, and say in prose
that it is unreachable. An uncheckable honest claim beats a checkable vague one.

**Decision trigger:** the first time a reader acts on a claim they could not verify and were
not told they could not, or the second package that needs the same prose disclaimer. Either
means the vocabulary needs a reachability field rather than a paragraph.

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

## Can one consequence of a decision go stale without superseding the record?

**Status:** open — raised 2026-07-31 by a case that had no honest answer

§6 and both decision READMEs offer exactly one mechanism: a new record `supersedes` the old, the
old gets `status: superseded` and `superseded_by`, and both stay forever. That is whole-record,
and it assumes a decision goes wrong all at once.

[0004](decisions/0004-no-mandated-tracker.md) is the case where it does not. Its decision —
nytka mandates no tracker, the invariant is one writable source per fact — is correct, binding,
and is the reason [0009](decisions/0009-tracker-snapshot-is-committed-yaml.md) is shaped the way
it is. One of its consequences, *"a snapshot generator is per-project"*, no longer holds: it was
written the day before the line had a repo that ships packages, and six connectors have since
shown the shape generalises.

Marking 0004 `superseded` would tell every future reader to stop following a rule we are actively
following. Leaving it silent means anyone reading 0004 gets an out-of-date sentence with nothing
in the file to say so. 0009 links backwards; nothing links forwards. **A reader who starts at
0004 — which is what the index sends them to — sees no sign the newer record exists.**

**Working rule:** the newer record names the superseded consequence explicitly and in full, the
older record is left untouched, and the asymmetry is accepted rather than papered over. Do not
invent a `partially_superseded_by` field for a sample of one.

**Decision trigger:** the second decision whose consequence goes stale while its decision stands,
or the first time someone acts on a stale consequence because the record it lives in still reads
as current. The second is the failure this entry predicts; if it happens, the format needs a
forward link and the argument for it will be concrete.

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

**Status:** open, and half-answered by something that shipped without asking.

The spec defines three operations. `ingest` is still a procedure an agent follows. `query` is
not, as of 2026-07-30: `nytka context <id>` assembles §10's Task row — the record, the decisions
and procedures it names, the project identity, `current-state.md` — and prints the index of the
decisions it deliberately did *not* open. It cites "SPEC.md §10" as its authority. So the count
in this entry ("only ships one tool") is wrong, and the question moved without the trigger below
ever firing.

What it did not become is a retrieval layer. `context` follows links a task already declares;
there is no index, no ranking and no embeddings, and a task that names nothing gets nothing. The
distinction worth keeping is between **assembling what a document points at**, which is
mechanical and cheap to verify, and **finding documents nobody pointed at**, which is the thing
this entry was actually nervous about.

**Working rule:** format and procedures, plus lint, plus link-following assembly. No index, no
ranking, no embeddings. A tool may load what a task names; it may not guess what a task meant.

**Decision trigger:** if a package grows past roughly 100 documents and agents start missing
relevant files, reconsider. Below that, a directory listing is the index. Separately: the first
time `context` is asked to return something a task did not name is the moment this stops being
a working rule and needs a decision.

---

## How does a template change reach a package that already exists?

**Status:** open

Scaffolding is solved and upgrading is not. `nytka init` refuses to touch a file that already
exists — correctly, since `AGENTS.md` is the most heavily authored file in a package and a
scaffolder that overwrote it would destroy the work worth keeping. So the command that knows
the current template is structurally unable to apply it, and there is no second command that
can. `nytka upgrade` rewrites `@nytka/*` ranges in a `package.json`, which most nytka packages
do not have.

This is not hypothetical. `<path-to-nytka>` shipped in `templates/project/AGENTS.md`, reached
two packages, and was fixed in each by hand — the template fix reached neither. Nothing in the
format records which template version a package came from, so nothing can tell a package that
predates a change from one that deliberately diverged. Those are different situations and they
look identical on disk.

**Working rule:** lint carries the weight. `unfilled-placeholder` and `template-comment` make
stale scaffolding visible in packages that already exist, which is the cheap 80% — a package
says what it is missing even though nothing can fix it for you. Template changes are applied by
hand, and the fact that two packages needed the same hand-edit is the cost being paid.

**Decision trigger:** the third package needing the same hand-edit, or the first template change
that cannot reasonably be applied by hand — a moved directory, a renamed required file. Either
means the format needs a provenance field naming the template version a package came from,
before it needs a migration command.

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
