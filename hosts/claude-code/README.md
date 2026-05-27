# Claude Code packaging

Builds the shared prompts in `prompts/` and schemas in `schemas/` into Claude Code subagent files.

## Build

From the repo root:

```
npm run build:claude-code
```

Output lands in `dist/claude-code/agents/`. Each file is a self-contained subagent definition with YAML frontmatter and the embedded JSON schema.

## Install into a project

Copy the generated agents into your project's `.claude/agents/` directory:

```
cp dist/claude-code/agents/*.md /path/to/your/project/.claude/agents/
```

Then in Claude Code, invoke the orchestrator that fits your phase.

**Ideating a new project:**

```
@advisor-council-orchestrator I want to build a GMAT error dashboard that lets me upload missed questions, classify mistakes, and recommend drills.
```

**Trying to ship a partially-built project:**

```
@ship-council-orchestrator
```

## Council flows

Advisor Council:

```
PM
  ↓
Engineer
  ↓
User Evaluator + Critic in parallel
  ↓
advisor-council-orchestrator synthesizes FinalPlan
```

There is no separate Advisor synthesizer agent. The Advisor orchestrator dispatches the four specialists, validates their JSON, and synthesizes the final plan.

Ship Council:

```
Definition of Done
  ↓
Edge Case Auditor + Polish Inspector + Deployment Readiness in parallel
  ↓
Cut-or-Ship Critic
  ↓
Ship Plan Synthesizer
```

The Ship Council does include `ship-plan-synthesizer` as a specialist agent. The Ship orchestrator first gathers repo state and runtime findings, passes that evidence through the shipping specialists, then returns the final ship plan.

## How the build works

For each agent it:

1. Reads the prompt body from `prompts/<council>/<name>.md`.
2. Replaces the `{schema}` placeholder with the corresponding JSON schema as a fenced code block.
3. Prepends YAML frontmatter (`name`, `description`, optionally `tools`).
4. Writes the result to `dist/claude-code/agents/<name>.md`.

Specialists do not declare tools; they read input from the orchestrator and produce JSON. The orchestrators declare the tools they need to dispatch subagents and gather project context.
