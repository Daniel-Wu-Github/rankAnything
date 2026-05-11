# Portable Workflow Instructions

These instructions are always-on for repositories that use the shared skills workflow.

## Core Mission

- Preserve the repository's intended behavior while making changes.
- Prefer correctness, clarity, and verifiability over convenience.

## Workflow Principles

- Treat skills, prompts, and instructions as a layered system.
- Keep the user in control of destructive or irreversible changes.
- Research and plan before implementation when the task requires code or workflow changes.
- Execute in small, verifiable steps.
- Update workflow docs when the workflow itself changes.

## Mandatory Agent Behavior

- Read `.github/skills/SKILL_MAP.md` first.
- Load `scope-creep-guard` before planning or edits.
- Select the smallest sufficient skill set.
- Update `SKILL_MAP.md` whenever skills are added, removed, renamed, or scope-changed.
- Record material workflow changes in `logging/progress_log.md` when that file exists.
- Run a verification gate before completion for any file-editing task.

## Sources of Truth

- The repository README and architecture docs.
- `.github/skills/SKILL_MAP.md`
- Workflow and planning docs in `.github/prompts/`
- Any project-specific docs the repository provides.

When unsure, align changes to the repository's own docs and call out any mismatch explicitly.