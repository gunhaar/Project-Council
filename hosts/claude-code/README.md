# Claude Code packaging

Builds the shared prompts in `prompts/` and schemas in `schemas/` into Claude Code subagent files.

## Build

From the repo root:

```
npm run build:claude-code
```

Output lands in `dist/claude-code/agents/`. Each file is a self-contained subagent definition with YAML frontmatter and the embedded JSON schema.

## Install into a project

Copy all five specialist agents plus the orchestrator into your project's `.claude/agents/` directory:

```
cp dist/claude-code/agents/*.md /path/to/your/project/.claude/agents/
```

Then in Claude Code, invoke the orchestrator with a project idea — for example by typing:

```
@startup-advisor-orchestrator I want to build a GMAT error dashboard that lets me upload missed questions, classify mistakes, and recommend drills.
```

The orchestrator will sequence the PM → Engineer → (User Evaluator + Critic in parallel) → Synthesizer workflow and return a markdown summary plus the raw FinalPlan JSON.

## How the build works

For each agent it:

1. Reads the prompt body from `prompts/<name>.md`.
2. Replaces the `{schema}` placeholder with the corresponding JSON schema as a fenced code block.
3. Prepends YAML frontmatter (`name`, `description`, optionally `tools`).
4. Writes the result to `dist/claude-code/agents/<name>.md`.

The five specialists don't declare `tools` — they don't need any; they read input from the orchestrator and produce JSON. The orchestrator declares `tools: Task, Read` because it dispatches subagents (Task) and may need to read a file the user references (Read).
