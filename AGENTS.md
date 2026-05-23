# Startup Advisor Board — system overview

A panel of specialist LLM agents that produce a structured critique and plan for a project idea. Everything is host-agnostic markdown plus JSON schemas, with thin per-host build scripts that wrap the shared core into native agent files.

## Agents

| Agent | Role | Output schema |
|---|---|---|
| `pm-agent` | Pragmatic PM. Scopes the MVP, names assumptions. | `schemas/pm.schema.json` |
| `engineer-agent` | Senior engineer. Proposes simplest architecture. | `schemas/engineer.schema.json` |
| `user-evaluator-agent` | UX evaluator. Finds friction and magic moments. | `schemas/user-evaluator.schema.json` |
| `critic-agent` | Skeptical critic. Names the hard truth. | `schemas/critic.schema.json` |
| `synthesizer-agent` | Senior partner. Writes the final plan. | `schemas/final-plan.schema.json` |
| `startup-advisor-orchestrator` | Routes, validates, synthesizes. | (uses FinalPlan) |

## Workflow

```
ProjectContext
     │
     ▼
   PM Agent                       (defines target user, MVP scope, P0/P1)
     │
     ▼
  Engineer Agent                  (gets PM output → proposes architecture, what to cut)
     │
     ├──────── parallel ────────┐
     ▼                          ▼
 User Evaluator              Critic
 (critiques PM+Eng plan)     (critiques PM+Eng plan)
     │                          │
     └──────────┬───────────────┘
                ▼
           Synthesizer
                ▼
           FinalPlan
```

Each downstream agent receives the original `ProjectContext` plus the relevant upstream outputs in full (the schemas are already terse — no summarization step needed).

## Repository layout

```
prompts/         Shared, host-agnostic markdown prompt bodies. {schema} is substituted at build time.
schemas/         JSON Schema for each specialist's structured output.
hosts/           One folder per supported host (claude-code, kiro, codex).
                 Each contains a build.mjs (or a README explaining the workaround).
dist/            Generated output, gitignored. Created by the build scripts.
examples/        Sample project contexts you can feed to the orchestrator.
```

## Design principles

- **Schemas are the source of truth.** Specialists must return valid JSON or the orchestrator retries once and then errors.
- **Prompts live in markdown.** Easy to read, easy to edit, no code recompile to iterate.
- **Host-specific packaging is thin.** The shared core never knows about Claude Code, Kiro, or Codex. Per-host build scripts wrap it.
- **One orchestrator does live decision-making.** The specialists are structured single-shot LLM calls; the orchestrator is the actual agent loop.
- **No runtime dependencies.** The repo is markdown + JSON + a Node build script with zero npm deps.

## Editing prompts

To iterate on a specialist's behavior, edit `prompts/<name>.md`. Re-run the relevant build script to regenerate the host-specific file. The prompt body keeps a `{schema}` placeholder that the build script replaces with the corresponding JSON schema as a fenced code block; don't remove that placeholder.

## Adding a new host

1. Create `hosts/<host>/build.mjs`.
2. Read each prompt, substitute `{schema}` with the matching JSON schema, wrap in the host's required frontmatter/config, and write to `dist/<host>/`.
3. Add an entry to `package.json` scripts.
4. Document install instructions in `hosts/<host>/README.md`.
