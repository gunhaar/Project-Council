# Project Council — system overview

Specialist LLM councils for each project lifecycle phase. Everything is host-agnostic markdown plus JSON schemas, with thin per-host build scripts that wrap the shared core into native agent files.

## Lifecycle and councils

```
Phase 1: Ideate    →  Advisor Council     (this repo)
Phase 2: Build     →  Claude Code itself  (no council yet — deferred)
Phase 3: Ship      →  Ship Council        (this repo)
```

The Building Council is intentionally deferred. Its role overlaps with what the main Claude Code agent already does during the build phase, and the right next step is to use Advisor + Ship on a real project and discover where the gap actually lives before designing for it.

## Advisor Council

| Agent | Role | Output schema |
|---|---|---|
| `pm-agent` | Pragmatic PM. Scopes the MVP. | `schemas/advisor/pm.schema.json` |
| `engineer-agent` | Senior engineer. Proposes simplest architecture. | `schemas/advisor/engineer.schema.json` |
| `user-evaluator-agent` | UX evaluator. Friction and magic moments. | `schemas/advisor/user-evaluator.schema.json` |
| `critic-agent` | Skeptical critic. Hard truth. | `schemas/advisor/critic.schema.json` |
| `synthesizer-agent` | Senior partner. Writes the final plan. | `schemas/advisor/final-plan.schema.json` |
| `advisor-council-orchestrator` | Routes, validates, synthesizes. | (uses FinalPlan) |

Workflow:

```
PM  →  Engineer  →  (User Evaluator + Critic in parallel)  →  Synthesizer
```

Each downstream agent receives the original `ProjectContext` plus the relevant upstream outputs in full.

## Ship Council

| Agent | Role | Output schema |
|---|---|---|
| `definition-of-done-agent` | Establishes a falsifiable finish line. | `schemas/ship/definition-of-done.schema.json` |
| `edge-case-auditor` | Walks user journey for unhappy paths. | `schemas/ship/edge-case-auditor.schema.json` |
| `polish-inspector` | Last-mile UX gaps. | `schemas/ship/polish-inspector.schema.json` |
| `deployment-readiness-agent` | Production gauntlet checklist. | `schemas/ship/deployment-readiness.schema.json` |
| `cut-or-ship-critic` | Brutal triage: ship-blocker / post-ship / kill. | `schemas/ship/cut-or-ship-critic.schema.json` |
| `ship-plan-synthesizer` | Actionable ship plan. | `schemas/ship/ship-plan.schema.json` |
| `ship-council-orchestrator` | Gathers repo state, routes, synthesizes. | (uses ShipPlan) |

Workflow:

```
Definition-of-Done                         ← finish line FIRST
        │
        ├──── parallel ────┬──────────┐
        ▼                  ▼          ▼
 Edge Case        Polish Inspector  Deployment Readiness
        │                  │          │
        └────────┬─────────┴──────────┘
                 ▼
         Cut-or-Ship Critic               ← brutal triage on combined audits
                 │
                 ▼
         Ship Plan Synthesizer
```

The orchestrator additionally has `Read`, `Bash`, and `Glob` access. Before invoking any specialist it gathers a `repo_snapshot` (git status, recent commits, file structure, README, deploy config) and passes that into each specialist's input.

## Repository layout

```
prompts/<council>/      Shared, host-agnostic markdown prompt bodies. {schema} is replaced at build time.
schemas/<council>/      JSON Schema for each specialist's structured output.
hosts/<host>/           One folder per supported host. Contains build.mjs and a README.
dist/                   Generated output, gitignored. Created by the build scripts.
examples/               Sample inputs you can feed to either council.
```

## Design principles

- **Schemas are the source of truth.** Specialists must return valid JSON or the orchestrator retries once and then errors.
- **Prompts live in markdown.** Easy to read, easy to edit, no code recompile to iterate.
- **Host-specific packaging is thin.** The shared core never knows about Claude Code, Kiro, or Codex. Per-host build scripts wrap it.
- **Orchestrators do live decision-making.** The specialists are structured single-shot LLM calls; the orchestrator is the actual agent loop.
- **Phase-specific councils, not one-council-fits-all.** Different lifecycle phases have different failure modes; different councils target them.
- **Defer over speculate.** New councils land when a real project surfaces the gap, not before.
- **No runtime dependencies.** The repo is markdown + JSON + a Node build script with zero npm deps.

## Editing prompts

To iterate on a specialist's behavior, edit `prompts/<council>/<name>.md`. Re-run the build script. The prompt body keeps a `{schema}` placeholder that the build script replaces with the corresponding JSON schema; don't remove it.

## Adding a new agent to an existing council

1. Add `prompts/<council>/<name>.md` with the `{schema}` placeholder.
2. Add `schemas/<council>/<name>.schema.json`.
3. Add an entry to the council's `agents` array in `hosts/claude-code/build.mjs`.
4. Update the council's orchestrator prompt to invoke the new agent.
5. Run the build.

## Adding a new council

1. Create `prompts/<council>/` and `schemas/<council>/`.
2. Write specialist prompts and schemas.
3. Write an `orchestrator.md` that sequences them.
4. Add a new council entry to `councils` in `hosts/claude-code/build.mjs`.
5. Update README and this file.

## Adding a new host

1. Create `hosts/<host>/build.mjs`.
2. Read each council's prompts, substitute `{schema}` with the matching JSON schema, wrap in the host's required frontmatter/config, write to `dist/<host>/`.
3. Add an entry to `package.json` scripts.
4. Document install instructions in `hosts/<host>/README.md`.
5. Note any host-specific constraints (e.g., Ship Council needs tool access for the repo-gather step).
