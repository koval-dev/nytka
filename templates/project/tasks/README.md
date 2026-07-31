# Tasks

`project.yaml → tasks.tracker` declares the mode. Never maintain status in two places.

## Minimum fields

```yaml
- id: WEB-001              # <PREFIX>-<nnn>, stable, never reused
  title: "..."             # one-line imperative
  status: ready            # see the lifecycle below
  priority: high           # high | medium | low
  owner:
  blockedBy: []
  context: |               # why — actionable without re-reading the source
  acceptanceCriteria:      # checkable by someone who was not in the conversation
    - "..."
  created: YYYY-MM-DD
  updated: YYYY-MM-DD
```

`acceptanceCriteria` is not decorative. Without it "done" is a judgment call, and tasks get
closed against what a draft said rather than what the live system shows.

## Lifecycle

`proposed` → `ready` → `in_progress` → `review` → `done`, with `blocked` off `in_progress` and
`cancelled` reachable from any open state. SPEC §8 has the table, the transitions and the rules.

**No task leaves `proposed` without a human recorded in `acceptedBy`.** Agents may add tasks
freely and may promote none of them — that is what keeps an agent's idea distinguishable from
the plan you committed to.

`todo` is an alias for `ready` and is read as `ready`, so a registry that already uses it needs
no rename.

## Fields each state adds

| State | Also required |
|---|---|
| `proposed` | `proposedBy` — an actor. `owner` may be empty. |
| every state after `proposed` | `acceptedBy` — a `human:` actor — and an `owner` |
| `blocked` | a non-empty `blockedBy` |
| `done` | `completionSummary`, `evidence` |
| `cancelled` | `reason` |

`workLog` and `artifacts` are optional everywhere and append-only.

## Generated views

`snapshot.md` / `snapshot.json` are generated and gitignored. Never hand-edit them.
Sync runs tracker → file only.
