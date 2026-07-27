# Tasks

`project.yaml → tasks.tracker` declares the mode. Never maintain status in two places.

## Minimum fields

```yaml
- id: WEB-001              # <PREFIX>-<nnn>, stable, never reused
  title: "..."             # one-line imperative
  status: todo             # todo | in_progress | blocked | done
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

## Generated views

`snapshot.md` / `snapshot.json` are generated and gitignored. Never hand-edit them.
Sync runs tracker → file only.
