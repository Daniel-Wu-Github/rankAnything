# Skill Map

This file is the central source of truth for repository skills.

All agents must do these steps before using or editing skills:

1. Read this file first.
2. Invoke the smallest sufficient skill set for the task via the `Skill` tool
   (e.g. `Skill(scope-creep-guard)`) — do not substitute `Read`/`cat` on a
   `SKILL.md` file for this; skills live under `.claude/skills/`, which the
   `Skill` tool discovers directly, so invoking it is both correct and
   cheaper than reading the file yourself.
3. If any skill is added, removed, renamed, or scope-changed, update this file in the same change.

## Selection Order

1. Classify the task (domain, risk, lifecycle stage).
2. Invoke `Skill(repo-workflow)`.
3. Invoke `Skill(scope-creep-guard)` for every task before planning or edits.
4. For any UI, visual, or frontend task, invoke `Skill(frontend-design)` and `Skill(ui-ux-pro-max)`. If the task targets phone-width viewports (mobile UX, responsive tables, touch interactions), also invoke `Skill(mobile-interaction-patterns)`.
5. For documentation maintenance, invoke `Skill(documentation-cohesion)`.
6. Add cross-cutting skills as needed in this order:
  1. `Skill(skill-map-governance)`
  2. `Skill(verification-gate)`
  3. `Skill(workflow-logging)`
  4. `Skill(remote-commit-logging)`
  5. `Skill(detailed-chat-output)`
  6. `Skill(self-improvement-loop)`
  7. `Skill(skill-improvement-loop)`

## Skill Registry

| Skill | Path | Purpose | Load When |
|---|---|---|---|
| repo-workflow | [repo-workflow/SKILL.md](repo-workflow/SKILL.md) | Maintain instruction and workflow surfaces | Any customization or workflow maintenance task |
| scope-creep-guard | [scope-creep-guard/SKILL.md](scope-creep-guard/SKILL.md) | Enforce explicit phase boundaries and prevent out-of-scope edits | Every task, before planning or edits |
| frontend-design | [frontend-design/SKILL.md](frontend-design/SKILL.md) | Create distinctive, production-grade frontend interfaces that avoid generic AI aesthetics | Any UI, visual, or frontend task on big-board.html |
| ui-ux-pro-max | [ui-ux-pro-max/SKILL.md](ui-ux-pro-max/SKILL.md) | Comprehensive UI/UX design intelligence: 50+ styles, 161 palettes, 57 font pairings, 99 UX guidelines | Any design system, component, or layout decision |
| mobile-interaction-patterns | [mobile-interaction-patterns/SKILL.md](mobile-interaction-patterns/SKILL.md) | Phone-width UX correctness: responsive-table collapse, filter drawers, touch/mouse/keyboard input parity, touch-target sizing, horizontal-scroll containment | Any task targeting <600px viewports or touch interactions (mobile UX passes, responsive tables, drag-on-touch) |
| documentation-cohesion | [documentation-cohesion/SKILL.md](documentation-cohesion/SKILL.md) | Ensure fixes integrate naturally and remain readable by humans and AI agents | Creating or refining planning docs, taskboards, prompts, or specification documents |
| skill-map-governance | [skill-map-governance/SKILL.md](skill-map-governance/SKILL.md) | Keep the skill map synchronized with the skill catalog | Any skill add/remove/rename/scope change |
| verification-gate | [verification-gate/SKILL.md](verification-gate/SKILL.md) | Enforce verification before completion | Any task that edits files, config, or process docs |
| workflow-logging | [workflow-logging/SKILL.md](workflow-logging/SKILL.md) | Capture decisions, progress, and change records | Material process or instruction updates |
| remote-commit-logging | [remote-commit-logging/SKILL.md](remote-commit-logging/SKILL.md) | Automatically log pushed commits by branch as detailed commit history | Tasks that add or maintain commit history automation |
| detailed-chat-output | [detailed-chat-output/SKILL.md](detailed-chat-output/SKILL.md) | Keep output structure clear and complete | Multi-step or high-risk tasks that need clear traceability |
| self-improvement-loop | [self-improvement-loop/SKILL.md](self-improvement-loop/SKILL.md) | Improve instructions after mistakes or drift | Repeated errors, stale docs, or avoidable rework |
| skill-improvement-loop | [skill-improvement-loop/SKILL.md](skill-improvement-loop/SKILL.md) | Summarize mistakes, evaluate skill effectiveness, and improve skills | Skill quality issues or missed auto-loading behavior |

## Maintenance Rules

- Keep skills non-feature-specific unless implementation code requires otherwise.
- Keep each skill narrow with explicit use and non-use guidance.
- Prefer updating existing skills over creating near-duplicates.
- Keep paths and links in this map valid.
- Shared skills (everything except `frontend-design`) are synced copies from
  `ai-workflow/skills/<name>` — edit them there, not here; re-run
  `ai-workflow/setup.sh --apply` in this repo to pick up a change.

## Change Log Requirement

When this map changes, include a short note in the same PR or commit message that states:

- what changed in the registry
- why the change was needed
- what tasks now load the new or revised skill

## Machine-Readable Index

```yaml
skillMap:
  version: 2
  sourceOfTruth: .claude/skills/SKILL_MAP.md
  mandatoryReadFirst: true
  requiredOnChange: true
  invokeVia: Skill tool (not Read)
  selectionOrder:
    - repo-workflow
    - scope-creep-guard
    - frontend-design
    - ui-ux-pro-max
    - mobile-interaction-patterns
    - documentation-cohesion
    - skill-map-governance
    - verification-gate
    - workflow-logging
    - remote-commit-logging
    - detailed-chat-output
    - self-improvement-loop
    - skill-improvement-loop
  registry:
    - name: repo-workflow
      path: .claude/skills/repo-workflow/SKILL.md
      type: meta-workflow
    - name: scope-creep-guard
      path: .claude/skills/scope-creep-guard/SKILL.md
      type: safety-governance
    - name: frontend-design
      path: .claude/skills/frontend-design/SKILL.md
      type: design-implementation
    - name: ui-ux-pro-max
      path: .claude/skills/ui-ux-pro-max/SKILL.md
      type: design-intelligence
    - name: mobile-interaction-patterns
      path: .claude/skills/mobile-interaction-patterns/SKILL.md
      type: design-implementation
    - name: documentation-cohesion
      path: .claude/skills/documentation-cohesion/SKILL.md
      type: documentation-quality
    - name: skill-map-governance
      path: .claude/skills/skill-map-governance/SKILL.md
      type: governance
    - name: verification-gate
      path: .claude/skills/verification-gate/SKILL.md
      type: validation
    - name: workflow-logging
      path: .claude/skills/workflow-logging/SKILL.md
      type: logging
    - name: remote-commit-logging
      path: .claude/skills/remote-commit-logging/SKILL.md
      type: logging-automation
    - name: detailed-chat-output
      path: .claude/skills/detailed-chat-output/SKILL.md
      type: communication
    - name: self-improvement-loop
      path: .claude/skills/self-improvement-loop/SKILL.md
      type: maintenance
    - name: skill-improvement-loop
      path: .claude/skills/skill-improvement-loop/SKILL.md
      type: evaluation
```
