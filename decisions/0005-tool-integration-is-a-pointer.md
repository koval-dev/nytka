---
type: Decision
title: Tool integration is a pointer, and nytka ships one launcher skill
status: stable
verified:
  - { by: "human:mike", at: 2026-07-27 }
  - { by: claude-opus-5, at: 2026-07-27, against: agent-tool-sources }
confidence: stated
stale_after: 2027-01-27
supersedes: null
superseded_by: null
---

# 0005 — Tool integration is a pointer, and nytka ships one launcher skill

## Decision

`AGENTS.md` stays the single canonical instruction file. A tool-specific file is created
**only** for a tool that will not read `AGENTS.md` itself, and when created it references
rather than restates.

Nytka ships one launcher skill at `skills/nytka/SKILL.md`. It resolves the nytka repo and
routes to a procedure. It contains no format content and is installed by symlink.

## Reason

The `.codex/` pointer this repo previously recommended does not exist — Codex reads root
`AGENTS.md` directly. A pointer file that no tool reads is worse than none: it looks like
wiring, so nobody checks whether the wiring works.

Verified 2026-07-27 against each tool's own source and documentation:

| Tool | Reads root `AGENTS.md`? | Detail |
|---|---|---|
| Codex | yes | Finds the project root by walking up for `.git`, then concatenates every `AGENTS.md` from root down to the cwd. `AGENTS.override.md` outranks it per directory; `~/.codex/AGENTS.md` is the global layer. |
| opencode | yes | Root `AGENTS.md`; global at `~/.config/opencode/AGENTS.md`; additional files via `opencode.json` → `instructions`. |
| Claude Code | no | v2.1.212 loads `CLAUDE.md` and `CLAUDE.local.md` only. `AGENTS.md` appears in its binary solely inside the `/init` prompt, as a file to read when *generating* `CLAUDE.md`. |

So `CLAUDE.md` is the one pointer worth shipping, and it uses Claude Code's `@AGENTS.md`
import rather than prose. Prose is a soft instruction the model may skip; the import inlines
the file at load time. Both are pointers — neither copies.

The skill is a launcher because the alternative is a bundle. A skill that carried its own copy
of `templates/project/` would be a second writable source for every scaffold file (P2), and one
that restated the format would be a second spec (0001). Resolving `$NYTKA` at run time keeps
one source and makes the skill location-independent, which is why it can be a single symlinked
file rather than an installed directory.

## Consequences

- The table above is a **dated observation about three tools that ship weekly**, not a fact.
  It carries `stale_after: 2027-01-27` so lint reopens it. It lives here and nowhere else;
  `procedures/init-project.md` and `skills/nytka/SKILL.md` link to it rather than repeat it.
- Nytka now has a second entry point to keep honest. The skill is allowed to route and to
  resolve paths; the moment it starts explaining frontmatter, it has become a spec fork and
  should be cut back.
- Installation is documented as a symlink. A copied `SKILL.md` is a fork that will drift
  silently, in exactly the way this format exists to make visible.
- Nytka still works with no skill installed. Pasting the SPEC.md URL remains the supported
  path, and the skill must never become the only way in.
