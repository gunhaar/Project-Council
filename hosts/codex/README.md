# Codex packaging

Builds Project Council for Codex's master-worker agent model. The recommended Codex integration is a global `project-council` skill: the main Codex agent becomes the orchestrator, then uses generic subagents for specialist passes when useful.

Claude Code supports direct named agent invocation. Codex currently works better as:

```
@ship-council-orchestrator
        ↓
project-council skill
        ↓
main Codex agent runs the council workflow
        ↓
generic subagents handle specialist passes
```

## Build

From the repo root:

```
npm run build:codex
```

Recommended output lands in `dist/codex/skills/project-council/`:

- `SKILL.md` contains the Codex trigger and execution model.
- `references/advisor.md` contains the Advisor Council workflow, specialist prompts, and schemas.
- `references/ship.md` contains the Ship Council workflow, specialist prompts, and schemas.

Legacy compatibility output still lands in `dist/codex/.codex/`, but it is not the recommended path because this Codex build does not reliably expose custom named agents as directly callable worker types.

## Install globally for Codex

To make the councils available in every Codex workspace on this machine:

```
npm run install:codex-global
```

This copies the generated skill into `~/.codex/skills/project-council/`. It also removes older managed Project Council launcher/agent blocks from `~/.codex/config.toml` if they were installed by a previous version.

Then start a fresh Codex thread in any repo and invoke whichever council fits your phase.

**Ideating a new project:**

```
@advisor-council-orchestrator I want to build a GMAT error dashboard that lets me upload missed questions, classify mistakes, and recommend drills.
```

**Trying to ship a partially-built project:**

```
@ship-council-orchestrator
```

The Ship Council must not ask what to evaluate. It infers the target from the current repository, runs discovery and a runtime walkthrough when possible, then produces a ship plan.

## How the build works

For each council it:

1. Reads the shared prompt bodies from `prompts/<council>/`.
2. Replaces each `{schema}` placeholder with the matching JSON schema.
3. Writes a Codex skill reference file with the orchestrator workflow, specialist prompts, and embedded schemas.
4. Writes legacy TOML agent files under `dist/codex/.codex/agents/` for experimental compatibility.
