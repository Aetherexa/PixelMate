# MIGRATION PLAN

Project: PixelMate
Standard Target: Aetherexa Foundation v1.0
Date: 2026-08-06

## Phase 1 - Repository Alignment

### Task 1.1
- Description: Add missing top-level Foundation directories (architecture, adrs, rfcs, meetings, roadmap, scripts, assets).
- Files affected: architecture/, adrs/, rfcs/, meetings/, roadmap/, scripts/, assets/
- Reason: Required repository standard parity.
- Risk: Very low (non-code additions).
- Estimated effort: 1-2 hours
- Rollback strategy: Remove added directories if policy changes.
- Acceptance Criteria: All required top-level directories exist and are documented.

### Task 1.2
- Description: Add foundation.yaml as machine-readable compliance manifest.
- Files affected: foundation.yaml
- Reason: Foundation standard requirement.
- Risk: Low (metadata only).
- Estimated effort: 30-60 minutes
- Rollback strategy: Revert foundation.yaml.
- Acceptance Criteria: foundation.yaml exists and accurately reflects repository compliance state.

## Phase 2 - Documentation Compliance

### Task 2.1
- Description: Generate ARCHITECTURE_INDEX.md mapping module boundaries and public APIs.
- Files affected: ARCHITECTURE_INDEX.md
- Reason: Architecture traceability requirement.
- Risk: Low (documentation only).
- Estimated effort: 1-2 hours
- Rollback strategy: Revert file and restore previous architecture docs only.
- Acceptance Criteria: Index includes ownership, boundaries, API surface, and dependency rules.

### Task 2.2
- Description: Generate SECURITY_REVIEW.md with findings, risk levels, and remediation recommendations.
- Files affected: SECURITY_REVIEW.md
- Reason: Security review evidence requirement.
- Risk: Low.
- Estimated effort: 1 hour
- Rollback strategy: Revert file.
- Acceptance Criteria: Review includes verdict, findings by severity, and security approval status.

### Task 2.3
- Description: Expand documentation scaffolding for PRD, decision logs, reviews, and releases.
- Files affected: docs/prd/, docs/decision-log/, docs/reviews/, docs/releases/
- Reason: AI collaboration and governance readiness.
- Risk: Very low.
- Estimated effort: 2-3 hours
- Rollback strategy: Remove scaffolding directories if superseded by alternate structure.
- Acceptance Criteria: Templates and readme indexes exist for each governance artifact type.

## Phase 3 - Automation and Governance Hardening

### Task 3.1
- Description: Review workflow overlap and identify simplification opportunities.
- Files affected: .github/workflows/*
- Reason: Reduce CI maintenance cost and accidental drift.
- Risk: Medium (workflow behavior changes if applied).
- Estimated effort: 2-4 hours
- Rollback strategy: Revert workflow changes and re-run CI.
- Acceptance Criteria: Equivalent or stronger gates with fewer redundant jobs.

### Task 3.2
- Description: Document branch and release governance controls in repository settings checklist.
- Files affected: docs/releases/README.md (or governance doc)
- Reason: Enforce protected release flow and reviewer requirements.
- Risk: Low.
- Estimated effort: 1 hour
- Rollback strategy: Revert docs updates.
- Acceptance Criteria: Clear checklist for required repository settings exists.

## Phase 4 - AI Collaboration and Decision Governance

### Task 4.1
- Description: Establish top-level ADR/RFC/meeting entrypoints and templates.
- Files affected: adrs/README.md, adrs/ADR_TEMPLATE.md, rfcs/README.md, rfcs/RFC_TEMPLATE.md, meetings/README.md, meetings/MEETING_TEMPLATE.md
- Reason: Foundation AI workflow requirement.
- Risk: Very low.
- Estimated effort: 1-2 hours
- Rollback strategy: Remove newly added templates if replaced by another format.
- Acceptance Criteria: Contributors can create ADRs/RFCs/meeting records from templates.

### Task 4.2
- Description: Seed decision log for traceability continuity.
- Files affected: docs/decision-log/DECISION_LOG.md
- Reason: Decision-history continuity and reviewability.
- Risk: Very low.
- Estimated effort: 30 minutes
- Rollback strategy: Revert file.
- Acceptance Criteria: Decision log contains initial migration decisions and rationale.

## Phase 5 - Certification and Sustainability

### Task 5.1
- Description: Publish complete compliance report and certification artifact.
- Files affected: FOUNDATION_COMPLIANCE_REPORT.md, FOUNDATION_CERTIFICATE.md
- Reason: Formal Foundation certification evidence.
- Risk: Low.
- Estimated effort: 1-2 hours
- Rollback strategy: Revert generated artifacts and regenerate with corrected data.
- Acceptance Criteria: Report contains all required steps and certification criteria outcomes.

### Task 5.2
- Description: Keep root and docs indexes synchronized with structural standards.
- Files affected: README.md, docs/README.md, roadmap/README.md, architecture/README.md
- Reason: Prevent doc drift and onboarding friction.
- Risk: Low.
- Estimated effort: 1 hour
- Rollback strategy: Revert index changes.
- Acceptance Criteria: Navigation references are current and consistent.
