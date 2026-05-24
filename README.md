# Startup Advisor Board

A panel of specialist LLM agents that critique and plan a project idea. One orchestrator routes a PM, a Senior Engineer, a User Evaluator, and a Critic, then synthesizes their structured outputs into a one-page plan.

Host-agnostic by design: the prompts and schemas are plain markdown and JSON. A small build script wraps them in the native agent format of whichever host you want to run them inside (Claude Code and Codex today, Kiro later). The board runs on **your existing subscription** for that host — no API keys, no per-call billing.

## Quick start (Claude Code)

```
npm run build:claude-code
cp dist/claude-code/agents/*.md /path/to/your/project/.claude/agents/
```

Then in Claude Code:

```
@startup-advisor-orchestrator I want to build a GMAT error dashboard that lets me upload missed questions, classify mistakes, and recommend drills.
```

The orchestrator will sequence the workflow, validate each specialist's structured output, and return both a readable markdown summary and the raw `FinalPlan` JSON.

## Quick start (Codex)

```
npm run build:codex
cp -R dist/codex/.codex /path/to/your/project/
```

Make sure the target project is trusted by Codex so project-local `.codex/config.toml` is loaded. The generated config registers each custom subagent and allows the orchestrator to spawn the specialist agents.

Then in Codex:

```
Use the startup-advisor-orchestrator subagent for this idea: I want to build a GMAT error dashboard that lets me upload missed questions, classify mistakes, and recommend drills.
```

The Codex orchestrator spawns separate specialist subagents, so PM, Engineer, User Evaluator, Critic, and Synthesizer each get their own context window and LLM call before the final aggregation.

See `hosts/codex/README.md` for the full deployment checklist and smoke-test commands.

## What you get

- **PM Agent** — target user, core problem, P0/P1 features, riskiest assumptions, recommended next step.
- **Senior Engineer Agent** — simplest architecture, code vs. LLM split, technical risks, what to cut.
- **User Evaluator Agent** — user value, friction points, magic moments, retention hooks, dealbreakers.
- **Critic Agent** — biggest flaw, overbuilt parts, unvalidated assumptions, hard truth.
- **Synthesizer** — final recommendation, what to build next, what to defer, tradeoffs, open questions, one-week plan.

All outputs validated against JSON schemas (`schemas/`).

## How it works

The orchestrator runs this sequence:

```
PM  →  Engineer  →  (User Evaluator + Critic in parallel)  →  Synthesizer
```

PM defines the product. Engineer responds to PM's scope with a concrete plan. User Evaluator and Critic both critique that plan in parallel (so neither anchors on the other). Synthesizer reconciles all four into one final recommendation.

See `AGENTS.md` for the full system overview, and `prompts/orchestrator.md` for the exact orchestration logic.

## Host support

| Host | Status |
|---|---|
| Claude Code | ✅ Supported. `npm run build:claude-code`. |
| Codex | ✅ Supported. `npm run build:codex`. |
| Kiro | ⏳ Placeholder. Format verification pending. |

See `hosts/<host>/README.md` for each.

## Repository layout

```
prompts/         Shared, host-agnostic prompt bodies (markdown).
schemas/         JSON Schema for each agent's structured output.
hosts/           Per-host packaging (build scripts + install docs).
dist/            Generated agent files (gitignored).
examples/        Sample project contexts.
AGENTS.md        System overview and design principles.
```

## Editing

To tune a specialist's behavior, edit `prompts/<name>.md` and re-run the build. Keep the `{schema}` placeholder intact — the build script substitutes the matching JSON schema.

## License

MIT.
