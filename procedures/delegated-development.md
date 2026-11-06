---
type: Procedure
title: Delegated development — optional experiment
description: Bounded implementation and fresh verification for an accepted software task
status: draft
generated: { by: codex, at: 2026-11-06 }
confidence: inferred
---

# Procedure — delegated development

**Trigger:** a software project opts into this experiment for an accepted task. Choose the
smallest checking level justified by the changed behaviour. This companion adds no conformance
rule, installation or task fields; [work-a-task](work-a-task.md) remains the daily loop.

**Inputs:** the project's `project.yaml`, `AGENTS.md`, current state, authoritative task and
the sources it names; existing development/check procedures; actual executor settings and
limits. The coordinator, normally the agent already managing the session, gathers these.
The owner is not asked to fill templates or repeat available information.

This is a draft to test, not evidence that delegation saves time. It addresses incomplete
handoffs and regressions by separating implementation from checking. Its preparation cost and
benefit need a real trial. Its effect on supervision and rework remains untested. The failure
conditions below are trial risks, not reported outcomes.

## Choose the checking level

| Level | Use when | Work required by this companion |
|---|---|---|
| Lightweight | Copy, styling or mechanical work has limited impact and straightforward checks. | Use the existing task procedure and record evidence there. No extra packet or verifier. Label self-review accurately. |
| Standard | A feature, bug fix or integration changes meaningful behaviour. | A bounded packet, implementation, then fresh verification, including affected earlier behaviour. |
| Elevated | Deletion, access control, migrations, retention, concurrency or transitions have costly failures. | Standard plus checks for the relevant failure and boundary cases in the required environments. |

Project-required checks apply at every level. A small diff can still need elevated checking;
shared components, weak coverage and changed data contracts can justify raising a level.
Undefined outcomes or conflicting criteria are readiness problems, not reasons to add agents.

## Steps

### 1. Establish readiness and authority

Follow [work-a-task](work-a-task.md): select one accepted, ready task, check its claims against
reachable sources and confirm dependencies are resolved before starting. A proposal waits for
human acceptance; an unresolved dependency stays a blocker under [SPEC §8](../SPEC.md#8-tasks).
Existing in-progress work can continue within its accepted scope.

Read project values from their existing homes:

| Source | Read for this task |
|---|---|
| `project.yaml` and authoritative tracker | Tracker mode/location, component repositories, accepted task, criterion identifiers and revision. |
| `AGENTS.md`, named decisions and development procedures | Writable roots and paths; base branch; commit/branch permissions; checks, fixtures, scratch-copy method, local services, external actions and acceptance authority. |
| Current state and task-linked requirements | Relevant context, expected behaviour, affected earlier requirements and known limitations. |
| Executor configuration and observable session controls | Delegation mechanism, role restrictions, supported models/effort, actual settings and usage records. |
| Existing project approvals and limits | Time, spending and correction ceilings, and which actions the current request already authorizes. |

Record unavailable settings as unknown; a requested model setting is not proof it took effect.
Resolve a missing permission before the dependent action. Source access grants no write rights.
Project rules govern commits, branches, external writes and spending throughout this procedure.
No extra confirmation is needed for actions already authorized by the request and those rules.

Record the checking level and reason. Lightweight work returns to the existing task loop here.

### 2. Prepare a bounded packet and baseline

The coordinator fills [delegation-packet](../templates/delegation-packet.md) from existing
records. Criteria and status remain authoritative in the tracker. Use references at a recorded
revision, or label copied criteria as frozen excerpts with their source and revision. If those
sources change, reconcile the packet before continuing. Packets are execution records, not a
second backlog or configuration system ([decision 0007](../decisions/0007-execution-fields-stay-out-of-the-task-record.md)).

Bound the scope, exclusions, writable paths, required environments, checks and expected results.
Map each changed behaviour or asset to affected earlier requirements/checklist items, their
checks and environments, and evidence needing renewal. If none are affected, state why. Keep
historical acceptance intact; a new regression check does not rewrite an old result.

Capture the repository root, full base commit, actual branch/HEAD, staged and unstaged changes,
untracked paths and known concurrent work. Preserve pre-existing edits and record which inputs
belong in the candidate. Keep baseline patches/hashes sufficient to compare contents afterward;
a list of filenames alone cannot show whether another agent changed them. Branch creation is
conditional on project permission. Use the project's permitted isolation method; preserve
unrelated edits in the source repository rather than resetting or hiding them.

The packet is ready when every selected criterion has a check or an explicit feasibility gap,
the regression map is bounded, and authority and limits are identified. A missing required
verification capability remains a gap, not permission to weaken the requirement.

### 3. Implement within the packet

Run roles sequentially: coordinator → implementer → coordinator → verifier → coordinator.
Implementers and verifiers do not delegate. Use supported settings appropriate to the task;
mechanical work can use less effort, while costly failure cases may justify more. Record actual
model/tier and effort when observable, without assuming similarly named settings are equivalent
across providers. No particular provider or most-expensive tier is required.

The implementer changes only the authorized scope, runs the required checks, appends work as it
happens to the authoritative task and returns [delegation-return](../templates/delegation-return.md).
Routine reversible choices within authority stay with the implementer. Material ambiguity,
criteria whose meaning needs changing, out-of-scope work and exhausted limits return to the
coordinator. Newly discovered work is proposed under the existing lifecycle, not self-accepted.

### 4. Freeze a reproducible candidate

Identify exactly what was checked using a project-permitted method:

| Method | Evidence to retain |
|---|---|
| Commit | Full candidate commit and diff from the recorded base. Identify any required inputs outside the commit with content hashes; the commit alone does not identify a dirty workspace. |
| Snapshot | Full base commit, replayable patch and its content hash, plus a manifest with relative paths and content hashes for added/untracked inputs and the inputs themselves. Preserve file modes/binary changes where relevant. No commit or new branch is required. |

Include result-affecting generated inputs and lockfiles. Record fixture identity and preparation,
runtime/tool/dependency versions, service configuration, commands and required environments.
Retain bounded evidence where the reviewer can retrieve it under project rules. Reconstruct a
scratch copy from these inputs, excluding credentials and private payloads; use approved
synthetic or sanitized fixtures. Missing access or a required device means **not checked**.
Emulation is not evidence from a physical device.

The coordinator prepares only the packet's separate verifier brief for the fresh verifier:
criteria and source revision, authoritative references, regression map, environment/check
requirements, candidate identity and full diff. Share setup and fixture instructions, not the
implementer's narrative, proposed verdict or explanation of why the change is correct.

### 5. Verify without fixing

Use a fresh agent context or separate session. If neither is available, report that independent
verification was not performed; self-review cannot fulfill standard/elevated verification.
Keep the gap visible and hand back the incomplete result under project rules.

The verifier reads the named authoritative sources, compares their meaning with the criteria
and regression map, and inspects the full candidate diff for omitted behaviour. It may follow
narrow references needed for a verdict and records material context added. Missing or
conflicting requirements return as gaps rather than guessed interpretations.

For every behavioural criterion, independently derive and check at least one concrete failure
or boundary case. Elevated work checks relevant costly failures: for example, retained data
survives cleanup, unauthorized access stays denied, or interruption leaves a recoverable
transition. Documents and mechanical assets get proportionate checks. Explain which required
behaviour each check covers; passing an implementation test alone is insufficient.

The verifier reports pass, fail or not checked per criterion, regression results, independently
derived cases, omitted coverage and reproducible findings using the return template. It does
not fix the candidate. Tests may create disposable outputs in the scratch copy; candidate
inputs remain unchanged. A fresh context reduces shared reasoning but proves neither
statistical independence nor complete coverage.

### 6. Correct within limits

The default ceiling is **one initial attempt plus at most two correction passes**, subject to
stricter project time, spending or retry limits. Stop sooner when another attempt is not useful.

- First correction: send concrete failure evidence to the implementer at the same supported
  setting.
- Second correction: a one-level increase, where supported, is permitted only when justified
  and already within project authority and budget. It is optional.
- The same failure reported twice stops further implementation and
  returns to the coordinator. At the ceiling, split genuinely separable work or raise the
  unresolved choice under project rules; splitting is not a way to restart the same failed loop.

Each changed candidate gets a new identity. Code, configuration, dependency, fixture or
requirement changes affecting a result invalidate it for the new candidate. Renew affected
criteria and regression checks through fresh verification; record why any earlier evidence
still applies. Send the verifier an updated brief for the renewed candidate. A correction
authorizes in-scope fixes, not a change to the meaning of acceptance or an expansion of authority.

### 7. Reconcile and hand back

Compare the source repository with its baseline. Attribute authorized changes and account for
preserved local edits. Unexpected changes stop a passing handoff; report them and leave them
intact. Scratch copies and state comparisons detect changes; prompts and executor hooks do not
by themselves establish a security boundary.

Only a packet with every required criterion and check passed can be reported as passing.
A failed criterion returns to `in_progress`; an unchecked required criterion stays an explicit
gap in the project's open workflow. A partial packet leaves the parent task open until all
parent criteria are met. Completed work goes to `review`, with per-criterion evidence and the
one thing most likely to be wrong. The verifier's verdict is separate from human acceptance;
agents do not close their own work.

Reconcile the authoritative tracker and current state, retain durable findings through
[ingest](ingest.md), then run applicable project checks and Nytka lint. Record failures and
warnings honestly. Packets and returns are linked evidence, not new tracker fields.

Capture available usage, elapsed delivery time, corrections, findings and owner attention in
the return. Allow unknown values; distinguish measurements, owner reports and estimates. Do
not ask for detailed time tracking merely to fill a field. Missing accounting does not block
authorized product work or a passing product result.

## Approval points

Use existing project authority for accepting proposed work, changing criteria/scope, accepting
completed work, commits/branches and external actions or spending. Use
[ask-the-owner](ask-the-owner.md) before an interruption. The coordinator resolves routine
choices from existing records and asks only for the missing decision or authorization.

## Failure conditions

| Symptom | Required response |
|---|---|
| Proposed work or an unresolved dependency is treated as startable | Return to readiness; preserve human acceptance and blocker rules. |
| Packet text disagrees with the authoritative criteria | Reconcile against the recorded source revision before implementation or a verdict. |
| Evidence cannot reproduce the candidate, fixture or environment | Mark affected checks not checked; identify the missing inputs. |
| Required fresh context, access/device or executor setting is unavailable | Report the capability gap; keep required verification unmet. |
| The verifier fixes what it is checking | Return fixes through the implementer; identify and verify the resulting candidate afresh. |
| Earlier behaviour or changed inputs are absent from the checks | Add the missing regression coverage and renew affected evidence. |
| Required criteria fail or remain unchecked | Report an incomplete result; no passing handoff or closure. |
| Source changes cannot be attributed to the baseline and authorized work | Stop the passing handoff and report them without resetting. |
| Corrections recur or exceed limits | Return to the coordinator under step 6; no automatic wider scope or spending. |

## Hypothetical adoption — commits forbidden

This example describes no real project or executed check. A project's `project.yaml` declares
`tracker: file`, `tasks/tasks.yaml` and the application repository. Its `AGENTS.md` names
`release/next` as the base branch, permits application edits only in `src/` and `tests/` plus
updates to the authoritative task record, forbids commits and new branches, and authorizes no
merge, deployment or external write. The coordinator reads
the accepted task, current state, named specification and decisions rather than asking the
owner to re-enter them. Existing project records reserve task acceptance and closure for the
owner.

The task links `procedures/checks.md`, which names `node --test`, a synthetic fixture recipe,
a disposable scratch-copy method, the required runtime and a permitted local test service.
The coordinator reads those values and existing time/spending limits there and in the project's
approvals, and reads session/role controls and supported settings from executor configuration.
Actual settings or usage that cannot be observed are recorded as unknown.

For a behavioural bug fix, the coordinator selects standard, maps affected earlier behaviour,
resolves `release/next` to a full base commit and records the actual current branch and HEAD.
Existing tracked edits in `docs/notes.md` and an untracked `notes.txt` are recorded in the
baseline, left untouched and excluded from the candidate. The allowed implementation is
captured as a hashed patch plus a manifest and retained copies of required added test inputs.
The verifier reconstructs that snapshot in the permitted scratch copy, follows the fixture
recipe and checks the candidate. The coordinator compares the source with the baseline and
hands the return and reproducible evidence to review, without a commit, merge or deployment.
If a fresh session is unavailable, the return instead records an incomplete verification gap.

## Bounded trial before broader adoption

Document authoring and product-trial acceptance are separate. A later request must name a target
project and accepted task for execution. Until then, prepare the reusable documents only.
Keep these templates outside `templates/project/`; adoption is deliberate, not a scaffold default.

For the first authorized code trial:

1. Recheck that task's readiness, project permissions and actual executor controls. Prepare one
   bounded standard or elevated packet from existing records, using the justified level.
2. Implement and verify the clean candidate through the sequential roles above. Reproduce its
   verification from the identified inputs and compare the source repository with its baseline.
3. In a second disposable scratch copy using synthetic fixtures, seed one known fault tied to
   a criterion. Retain the seed diff and distinct candidate identity separately. A fresh verifier
   receives that candidate's brief without the fault's location or expected answer; require it
   to find the fault. The seeded copy is never delivered, merged or copied back to the source.
4. Compare the source with its baseline again after the trial. Record reproducibility,
   findings, missed faults, retries, total delivery time and available usage/owner-attention
   data. Unknowns stay unknown. A missed seed or escaped defect requires reviewing the failed
   check and recording the limitation before the next relevant packet.

A successful trial shows feasibility, not general verifier reliability or savings. Repeat seeded
checks after verification-method changes, escaped defects or an evidence-based project cadence.
If useful, compare representative work across two projects with their usual workflow, noting
differences in task complexity and unavailable baselines. Broader use depends on less supervision
or rework at acceptable delivery cost; simplify or skip the companion when coordination consumes
the benefit. No fixed model split, fault-injection cadence or percentage savings is assumed.

## Done when

The identified candidate has a complete criterion/regression return, reproducible evidence,
an accounted-for source baseline and required project checks; completed work is in `review`
awaiting human acceptance. Gaps and failures are explicit incomplete outcomes, never a pass.
Available accounting is recorded without making unknown measurements a product blocker.
