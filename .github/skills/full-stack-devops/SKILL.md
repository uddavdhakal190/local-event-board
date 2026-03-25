---
name: full-stack-devops
description: 'End-to-end full-stack DevOps workflow for planning, building, testing, securing, deploying, and operating web applications. Use for feature delivery, release preparation, production hardening, and incident follow-up across frontend, backend, database, and infrastructure.'
argument-hint: 'Describe the product change, environment, and constraints'
user-invocable: true
---

# Full Stack DevOps

## What This Skill Produces
- A delivery plan that connects product intent to implementation and operations.
- A risk-aware build and test workflow across frontend, backend, database, and infrastructure.
- A CI/CD gate strategy with promotion criteria from commit to production.
- Security and reliability checks before release.
- A deploy, verify, and rollback-ready release decision.
- Post-release monitoring and follow-up actions.

## When to Use
- Shipping a new feature that spans UI, APIs, and data storage.
- Migrating schema or infrastructure with runtime impact.
- Preparing a release candidate for staging or production.
- Responding to incidents and preventing recurrence.

## Required Inputs
- Change summary: what is being delivered and why.
- System context: relevant services, APIs, database entities, and environments.
- Constraints: deadlines, compliance/security requirements, SLO/SLA targets.
- Delivery boundaries: in-scope vs out-of-scope work.

If inputs are incomplete, request missing details and proceed with explicit assumptions.

## Workflow

### 1) Define Scope And Risk
1. Translate the request into user impact, system impact, and operational impact.
2. Identify touched layers: frontend, backend, database, CI/CD, infra, observability.
3. Classify risk level per layer (high/medium/low) by impact x likelihood.

Decision points:
- High risk: require staged rollout, stronger test gates, and rollback rehearsals.
- Medium risk: targeted gates and canary or limited exposure rollout.
- Low risk: standard release path with smoke validation.

### 2) Design The Delivery Slice
1. Break work into thin vertical slices that can be validated independently.
2. For each slice, define:
- Code changes.
- Data/migration changes.
- Config/secrets changes.
- Monitoring and alerting updates.
3. Define explicit acceptance criteria and non-functional criteria (latency, error rate, security).

### 3) Implement With Guardrails
1. Apply changes in small, reviewable commits.
2. Keep compatibility for rolling deploys (backward-compatible contracts first).
3. Use feature flags for risky behavior or incomplete UX.
4. Add or update runbooks when behavior or ops workflows change.

### 4) Validate Locally And In CI
1. Run static checks and quality gates:
- Linting and formatting.
- Type checking.
- Unit tests.
- Dependency/security scanning.
2. Run integration or contract tests for service boundaries.
3. Validate migrations against representative seed data.
4. Ensure CI pipeline mirrors required release gates.
5. Define promotion gates explicitly:
- Build and test gates for pull requests.
- Artifact integrity and provenance checks before publish.
- Staging verification gates before production approval.

### 4.1) CI/CD Pipeline Controls
1. Confirm deterministic build inputs (locked dependencies, reproducible configs).
2. Enforce branch protection with required checks and review policies.
3. Separate deploy permissions from merge permissions when possible.
4. Store pipeline secrets in managed secret stores, never in source.
5. Require manual approval for high-risk production promotions.

Decision points:
- Failing quality gates: stop and fix before continuing.
- Flaky or environment-dependent failures: isolate and label as blocking or non-blocking with rationale.

### 5) Security And Reliability Hardening
1. Verify authN/authZ paths for new or changed endpoints.
2. Confirm secret handling, least-privilege permissions, and no sensitive logging.
3. Validate resilience behavior:
- Timeout and retry strategy.
- Idempotency for retried operations.
- Circuit-breaker/backoff expectations where relevant.
4. Confirm observability:
- Structured logs.
- Key metrics and dashboards.
- Alert thresholds aligned with SLOs.

### 6) Release Planning And Deployment
1. Prepare a release note with risks, migration order, and fallback steps.
2. Choose rollout strategy based on risk:
- Standard deploy.
- Canary rollout.
- Blue/green or phased rollout.
3. Execute deploy with checkpoints:
- Pre-deploy backup/snapshot where required.
- Deploy app and migration in safe order.
- Validate health checks and smoke tests.

Decision points:
- Regression detected: trigger rollback/fallback immediately.
- Partial degradation: pause rollout and contain blast radius before proceeding.

### 7) Post-Deploy Verification And Operations
1. Run post-deploy smoke and critical-path tests.
2. Compare key metrics to baseline (latency, error rate, throughput).
3. Watch logs and alerts during the stabilization window.
4. Record outcome and unresolved risks.

### 8) Incident Follow-Up And Continuous Improvement
1. If an incident occurs, document timeline, root cause, and customer impact.
2. Define corrective and preventive actions with owners and due dates.
3. Feed lessons into test coverage, runbooks, and rollout policy.

## Output Format
Provide results in this order:
1. Scope and risk matrix by system layer.
2. Delivery slices and acceptance criteria.
3. Validation results (local and CI).
4. Security and reliability checks.
5. Deployment plan and rollback strategy.
6. Post-deploy verification status.
7. Final recommendation: go, go with caveats, or no-go.

## Quality Criteria
- Every acceptance criterion has a matching validation artifact.
- High-risk changes include explicit rollback and blast-radius controls.
- Security-sensitive paths have deny and allow-path checks.
- CI/CD promotion gates are explicit, auditable, and enforced.
- Release decision is evidence-based and reproducible.
