---
type: Procedure
title: Collect data from an external system
description: Find whether a connector exists, install it, and register what it collected as a dataset
status: draft
generated: { by: claude-opus-5, at: 2026-08-06 }
---

# Procedure — collect data

**Trigger:** a task needs real numbers or real content from a system outside the repo — an
analytics property, a search console, a CMS, an ad account.

**Inputs:** the task record, `references/systems.yaml`, `project.yaml`, and the owner's answer
on anything that spends money or touches a client's account.

The failure this procedure exists to prevent is an agent producing the numbers instead of
fetching them — or fetching them once into a chat and treating the transcript as the record.
Both leave a claim with no date and no source, which under P4 has no standing however
confident the prose sounds.

---

## Step 1 — is there already a connector?

```bash
npm search keywords:nytka-plugin
```

That search **is** the catalogue. No list of connectors is committed anywhere in this repo, on
purpose: a list in a file is wrong the first time one is published or renamed, and P3 says the
live system is the truth.

**A catalogue is not an endorsement.** The keyword is self-declared — anyone may publish a
package carrying it, and it lands in the same results. `@nytka/*` is the maintained line;
anything else is someone else's, which is by design and not a warning against it. Read a
third-party package before installing it, and remember that an install runs its code.

As of 2026-08-06 it returns six — Google Search Console, GA4, Google Ads, Google Tag Manager,
Sanity and DataForSEO. That is a dated observation, not a fact. Run the search.

For a project that already has some installed:

```bash
npx @nytka/cli info              # what is installed, and which credentials it can see
npx @nytka/cli info --latest     # also ask npm what the current versions are
```

## Step 2 — install it

```bash
npx @nytka/cli add gsc                # short name
npx @nytka/cli add plugin-gsc         # the prefixed form resolves too
npx @nytka/cli add @acme/connector    # anything declaring itself a nytka plugin
```

`-D` installs as a devDependency, `-y` skips the confirmation. Installing into a client's
project is an approval point — see below.

## Step 3 — credentials, and the reference entry

`add` writes `.env.example` and never `.env`. **The variable name is documentation and belongs
in the repo; the value is the owner's and never enters it** — not a file, not a commit message,
not a task description. Nothing in the CLI reads or writes a credential.

While you are there, record the system in `references/systems.yaml`: its identifiers, the
connector that reads it, and the *name* of the variable holding its token.

```yaml
gsc:
  siteUrl: https://example.com/
  connector: "@nytka/plugin-gsc"
  authEnvVar: GSC_SERVICE_ACCOUNT
```

That entry is what makes the next agent's question — *how do we get search data here* —
answerable from the repo rather than from a search engine. It is also the half of discovery
this procedure cannot fix on its own: the catalogue says what exists, the reference entry says
what **this** project uses.

## Step 4 — register what it collected

The connector writes a payload and registers it. Check the result against SPEC §9 rather than
assuming it did: `datasets/index.json` is committed, the payload under `datasets/payloads/` is
not, and every entry carries `collectedAt` — plus `validUntil` for anything that expires.

**Never load a payload into agent context.** Query it with a script and write the conclusion
into `research/`. A dataset is evidence; a research item is knowledge. The example in §9 is a
227 MB export — read into a session, that is a whole context window spent on data a two-line
script would have reduced to a sentence.

If the connector appended to an existing `index.json`, check the diff is still readable. A
writer must not reformat entries it did not touch. That is a working rule rather than a settled
contract — see the serialisation question in [unresolved.md](../unresolved.md).

## Step 5 — when no connector exists

Collect by hand and register the dataset identically. The format does not care how a payload
arrived; it cares that the entry says when it was collected, from what, and when to stop
trusting it.

Do not write a connector for a one-off. Three collections of the same shape is when a package
starts to pay for itself.

**If you do write one, put `nytka-plugin` in its `keywords`.** That is the entire registration:
no approval, no central list, and the package appears in Step 1's search for everyone else. It
may live in any repo and under any scope — `add` takes `@your-scope/whatever`, and installs a
package without the keyword too, printing a note that it is missing. A connector nytka itself
publishes is installed rather than referenced, so it ships from the development repo and never
from this one; yours is bound by no such rule.

---

## Approval points

| Moment | Why it earns the interrupt |
|---|---|
| Installing a connector into a client's project | it adds a dependency and a supply chain the owner did not choose |
| First run against a client's account | it is their data, and usually their quota |
| Anything metered or paid | it spends money, which is one of the three things that qualify |

Route each through [ask-the-owner.md](ask-the-owner.md) — stakes in one sentence, options with
their costs, a recommendation. Before the work, not after.

## Failure conditions

| Symptom | Cause | Fix |
|---|---|---|
| An agent quotes a figure with no date | a payload was read into chat and never registered | register the dataset; the conclusion belongs in `research/` |
| A `datasets/index.json` diff nobody can review | a writer re-serialised entries it did not touch | restore the shape, append only what changed |
| A payload is committed | `datasets/payloads/` never reached `.gitignore` | untrack it, fix the ignore, rotate anything it exposed |
| A token in a commit message or a task | the value was pasted where the name belonged | rotate it first, then Step 3 |
| Connector installed, nothing collected | credentials were never supplied | `nytka info` reports which it can see |
| Two connectors writing one dataset id | the id was chosen twice, so neither owns it | one writable source per fact (P2) — rename one |
| An agent searched the web for a connector | nobody ran Step 1 | this procedure, from the top |

## Done when

`datasets/index.json` has an entry with a date and a source, the payload is gitignored, the
system appears in `references/systems.yaml` with its connector and variable name, and
`nytka lint .` reports no errors.
