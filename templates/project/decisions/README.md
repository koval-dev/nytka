# Decisions

One file per decision: `NNNN-kebab-title.md`. Numbers are never reused or renumbered.
A decision belongs here when it **constrains future work** — not for casual opinions.

## Format

```md
---
type: Decision
title: <what was chosen>
status: stable            # draft | stable | deprecated | superseded
verified: [{ by: "human:<id>", at: <date> }]
supersedes: null
superseded_by: null
---

## Decision       what was chosen, imperative
## Reason         why — including the evidence
## Consequences   what this now forces or forbids
```

## Superseding

Create the new record with `supersedes: NNNN`. Set the old one's `status: superseded` and
`superseded_by`. Change nothing else in the old file. Both stay forever — the wrong old
decision is how you discover why the new one exists.

## Index

| # | Decision | Status |
|---|---|---|
