---
name: senior-tester
description: 'Senior-level test workflow for risk-based planning, scenario design, execution, and quality sign-off. Use when reviewing features, bug fixes, releases, or pull requests that need strong QA coverage and clear go/no-go recommendations.'
argument-hint: 'Describe the feature, change, or bugfix to test'
user-invocable: true
---

# Senior Tester

## What This Skill Produces
- A risk-based test strategy for the requested change.
- A prioritized test matrix (happy path, edge cases, negative paths, regression impact).
- Clear execution notes, defect reports, and retest outcomes.
- A final go/no-go recommendation with explicit exit criteria status.

## When to Use
- New feature validation before merge or release.
- Bugfix verification where regression risk exists.
- Release readiness checks for high-impact user flows.
- Requirements or acceptance criteria review for testability gaps.

## Required Inputs
- Change summary: what changed and why.
- Target environment(s): local, staging, production-like.
- Requirements/acceptance criteria or expected behavior.
- Constraints: timeline, scope limits, known risks.

If key inputs are missing, request them first and proceed with clearly labeled assumptions.

## Senior Test Workflow

### 1) Scope And Risk Triage
1. Map impacted components, user journeys, and dependencies.
2. Assign risk level per area using probability x impact.
3. Identify critical data, permissions, integrations, and failure modes.

Decision points:
- High risk: require deeper scenario coverage, stricter exit criteria, and mandatory regression checks.
- Medium risk: balanced depth with targeted regression.
- Low risk: focus on core behavior, basic negative checks, and smoke regression.

### 2) Test Strategy Design
1. Build coverage categories:
- Functional behavior.
- Negative and error handling.
- Boundary and edge cases.
- Integration and contract behavior.
- Role/permission and data integrity checks.
2. Prioritize with P0/P1/P2 labels:
- P0: release-blocking flows.
- P1: important non-blocking behavior.
- P2: lower-risk or nice-to-have coverage.
3. Define what to automate now, automate later, or validate manually.

### 3) Test Case Authoring
1. Write concise scenarios with preconditions, steps, and expected outcomes.
2. Include explicit inputs and assertions for each scenario.
3. Add at least one boundary and one negative case for each critical rule.
4. Add regression links for previously affected areas.

### 4) Environment And Data Readiness
1. Verify environment parity and feature flags.
2. Prepare deterministic test data sets.
3. Confirm observability: logs, error surfaces, and monitoring signals.

Decision points:
- If environment instability blocks confidence, mark results as provisional and list blocked checks.
- If data dependencies are missing, document impact and provide fallback validation plan.

### 5) Execution And Evidence
1. Execute tests in this order: P0, then P1, then P2.
2. Capture evidence for failures and critical passes (logs, screenshots, traces, or output snippets).
3. Reproduce failures minimally and isolate likely root-cause area.

### 6) Defect Triage And Retest
1. Report defects with severity, reproducibility, impact, and clear reproduction steps.
2. Suggest likely ownership domain when possible.
3. Retest fixes plus nearby regression surfaces.

Severity baseline:
- Sev1: core flow broken or data/security risk.
- Sev2: major degradation with workaround.
- Sev3: minor issue with low user impact.

### 7) Exit Criteria And Recommendation
Check all before go recommendation:
- All P0 tests pass.
- No open Sev1 defects.
- Open Sev2 defects are accepted with explicit rationale.
- Required regressions completed for impacted areas.
- Test evidence and assumptions are documented.

Output one of:
- Go.
- Go with caveats.
- No-go.

## Output Format
Use this structure in final responses:
1. Scope and risk summary.
2. Test matrix (P0/P1/P2).
3. Execution results and evidence notes.
4. Defects and retest status.
5. Exit criteria checklist.
6. Final recommendation (Go/Go with caveats/No-go).

For checklist sections, include a one-line rationale for each unchecked or conditionally checked item.

## Quality Bar
- Traceability: every critical requirement maps to at least one scenario.
- Clarity: another tester can reproduce outcomes from the notes.
- Signal quality: findings distinguish product defects from environment issues.
- Decision readiness: recommendation is supported by explicit criteria and evidence.
