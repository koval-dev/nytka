# Research

Distilled conclusions, not raw sources. If it needs a large file to support it, the file goes
in `datasets/` and the conclusion goes here.

## Frontmatter

```yaml
---
type: Research
title:
status: draft              # draft | stable | deprecated
generated: { by: <model>, at: <date> }
confidence: inferred       # stated | inferred | ambiguous
stale_after: <date>        # omit only if it genuinely does not expire
sources: []
---
```

Sections: **Question · Findings · Limitations · Reuse guidance**

`Limitations` is not optional — it is what stops a stale finding being cited as fact.
