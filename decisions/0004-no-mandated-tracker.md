---
type: Decision
title: Weave does not mandate a task tracker
status: stable
verified: [{ by: "human:mike", at: 2026-07-27 }]
confidence: stated
supersedes: null
superseded_by: null
---

# 0004 — Weave does not mandate a task tracker

## Decision

`project.yaml → tasks.tracker` declares the tracker (`file`, `github-projects`, `linear`,
`jira`). Weave specifies the *contract* — minimum fields, and that status has exactly one
writable home — not the tool.

## Reason

Trackers are where framework adoption dies. A framework that requires GitHub cannot be used
on a client who does not have it; one that requires a file cannot span three repos or produce
an event history.

The real invariant is not which tool, it is **one writable source per fact**. That holds in
every mode, so that is what the spec constrains.

## Consequences

- Switching trackers is a config change plus a migration, not a rewrite of the package.
- When an external tracker is used, the repo may hold only a *generated read-only* snapshot,
  and sync runs tracker → file. Two writable copies of a status field is the failure this
  prevents.
- Weave ships no tracker integration. A snapshot generator is per-project.
- `acceptanceCriteria` is required in every mode. Without it "done" is a judgment call, which
  is how a backlog drifts from the system it describes.
