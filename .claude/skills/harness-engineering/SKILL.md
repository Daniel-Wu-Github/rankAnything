---
name: harness-engineering
description: |
  Build autonomous harnesses with locked metrics, validation gates, and rollback safety.
  Covers automated testing, metric tracking, failure detection, and safe rollback patterns.
persona:
  - "Test harness architect"
  - "Metrics engineer"
  - "Safety systems designer"
preferred_tools:
  - metric_tracking
  - assertion_frameworks
  - state_snapshots
  - test_harnesses
avoid_tools:
  - manual_verification
  - hardcoded_thresholds
job_scope:
  - "Design autonomous validation harnesses"
  - "Implement locked metrics with rollback triggers"
  - "Create phase gates with objective criteria"
when_to_use:
  - "When defining validation gates between phases"
  - "When building automated test harnesses"
  - "When tracking metrics across long-running tasks"
  - "When designing fail-safe rollback strategies"
example_prompts:
  - "Build a harness for CLV gate validation with rollback on failure"
  - "Design locked metrics for Phase 0–2 validation pipeline"
  - "Implement phase gates with objective go/no-go criteria"
---

# Harness Engineering Skill

**Status:** Placeholder (source repo not directly accessible)

## Overview

This skill covers building autonomous harnesses with locked metrics, validation gates, and safe rollback strategies. Key patterns include:

- **Locked Metrics:** Immutable metric definitions that trigger automation
- **Validation Gates:** Phase gates with objective pass/fail criteria
- **Rollback Safety:** Automatic reversal of changes on validation failure
- **Autonomous Monitoring:** Real-time metric tracking without manual intervention
- **Failure Detection:** Automatic detection of breaking changes or regressions

## Application to BKE-Market

**When you would use this:** All phases, especially Phase 2 (CLV Gate) and phase transitions.

**Example 1: CLV Gate Harness**
```yaml
gate: "CLV_GATE"
metrics:
  - name: "mean_clv"
    type: "numeric"
    operator: ">"
    value: 0.005
    locked: true
  
  - name: "simulated_pnl"
    type: "numeric"
    operator: ">"
    value: 0
    locked: true
  
  - name: "bet_count"
    type: "numeric"
    operator: ">="
    value: 200
    locked: true

on_pass: "proceed_to_phase_3"
on_fail: "rollback_to_phase_1"
```

**Example 2: Data Integrity Harness**
```yaml
gate: "PHASE_0_VALIDATION"
checks:
  - schema_consistent (all odds sources match)
  - no_missing_games (all seasons, all sources)
  - no_duplicates (game_id is unique per source)
  - no_nans (probabilities valid)
  - temporal_order (dates monotonic within season)

on_pass: "mark_phase_0_complete"
on_fail: "auto_rollback + alert"
```

## Best Practices for BKE-Market

1. **Metric Immutability:** Once CLV gate thresholds are set (CLV > 0.5%, P&L > 0), don't change them for the current backtest.
2. **Phase Gates:** Every phase has an explicit go/no-go harness. No hand-waving.
3. **Rollback Strategy:** On failure, automatically revert to the previous phase's code. Don't patch forward.
4. **Audit Trail:** Every gate pass/fail is logged with timestamps, metrics, and who triggered it.
5. **Documentation:** Harness criteria are in CLAUDE.md + loop/current_phase_plan.DO_NOT_CHANGE.txt.

## Reference

For full details on harness engineering patterns, see the upstream repo:
https://github.com/muratcankoylan/agent-skills-for-context-engineering

## When NOT to Use

- Exploratory research: Use informal evaluation instead.
- Low-stakes decisions: Overhead not justified.
