# Decisions — about nytka itself

Why nytka is shaped the way it is. Decisions about *using* nytka belong in the adopting
project, not here.

Format and superseding rules: [SPEC.md §6](../SPEC.md).

## Index

| # | Decision | Status |
|---|---|---|
| 0001 | [SPEC.md is one self-contained file](0001-spec-is-one-file.md) | stable |
| 0002 | [Borrow OKF's vocabulary rather than invent one](0002-borrow-okf-vocabulary.md) | stable |
| 0003 | [Lint ships with zero dependencies](0003-lint-zero-dependencies.md) | stable |
| 0004 | [Nytka does not mandate a task tracker](0004-no-mandated-tracker.md) | stable |
| 0005 | [Tool integration is a pointer, and nytka ships one launcher skill](0005-tool-integration-is-a-pointer.md) | stable |
| 0006 | [Tasks have a named lifecycle, and no task leaves `proposed` without a human](0006-task-lifecycle.md) | stable |
| 0007 | [Execution fields stay out of the task record](0007-execution-fields-stay-out-of-the-task-record.md) | stable |
| 0008 | [Five rules govern adding a lint check](0008-lint-check-rules.md) | stable |
| 0009 | [A tracker snapshot is committed YAML, and the line may ship one generator](0009-tracker-snapshot-is-committed-yaml.md) | draft |
