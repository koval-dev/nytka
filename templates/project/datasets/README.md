# Datasets

`index.json` is the registry and is committed. The payloads it points at are gitignored.

## Rules

- **Never load a payload into agent context.** Query it with a script; record the conclusion
  in `research/`. A dataset is evidence; a research item is knowledge.
- Every entry needs `collectedAt`. `validUntil` is required for anything that expires.
- `status`: `current` (safe to use) · `historical` (a record of what happened, not of what is
  true now) · `stale` (superseded, kept for provenance).
- If a payload contradicts live system state, the live system wins.
