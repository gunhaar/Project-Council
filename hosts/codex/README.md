# Codex packaging

Builds the shared prompts in `prompts/` and schemas in `schemas/` into Codex custom agent files for the Advisor and Ship councils.

## Build

From the repo root:

```
npm run build:codex
```

Output lands in `dist/codex/.codex/`:

- `config.toml` registers all Advisor Council and Ship Council agents.
- `agents/*.toml` contains one self-contained specialist or orchestrator definition.

## Install into a project

If the target project does not already have a `.codex/` directory, copy the generated directory into the project root:

```
cp -R dist/codex/.codex /path/to/your/project/.codex
```

If the project already has a `.codex/` directory, copy the generated contents into it and merge carefully with any existing Codex configuration:

```
cp -R dist/codex/.codex/* /path/to/your/project/.codex/
```

Then in Codex, invoke whichever council fits your phase.

**Ideating a new project:**

```
@advisor-council-orchestrator I want to build a GMAT error dashboard that lets me upload missed questions, classify mistakes, and recommend drills.
```

**Trying to ship a partially-built project:**

```
@ship-council-orchestrator
```

The Advisor Council returns a markdown summary plus raw `FinalPlan` JSON. The Ship Council gathers repo state, attempts a runtime walkthrough with ask-before-side-effects rules, and returns a markdown ship plan plus raw `ShipPlan` JSON.

## Install globally for Codex

To make the councils available in every Codex workspace on this machine:

```
npm run install:codex-global
```

This copies generated agent files into `~/.codex/agents/`, adds a managed Project Council block to `~/.codex/config.toml`, and installs a small global launcher instruction so `@ship-council-orchestrator` and `@advisor-council-orchestrator` run the generated orchestrator prompts instead of being treated as plain text.

## How the build works

For each agent it:

1. Reads the prompt body from `prompts/<council>/<name>.md`.
2. Replaces the `{schema}` placeholder with the corresponding JSON schema as a fenced code block.
3. Wraps the result as TOML `developer_instructions`.
4. Writes the result to `dist/codex/.codex/agents/<name>.toml`.

Each orchestrator also embeds its council's validation schemas because a target project may not have this repository's `schemas/` directory. It instructs Codex to spawn each specialist as a separate custom agent run and to retry once if a specialist returns invalid JSON.
