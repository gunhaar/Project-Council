# Project Councils

Panels of specialist LLM agents for each project lifecycle phase. Currently ships:

- **Advisor Council** — for ideation. Produces a structured project plan from an idea.
- **Ship Council** — for the final 20%. Audits a partially-built project and produces an actionable ship plan.

Host-agnostic by design: prompts and schemas are plain markdown and JSON. A small build script wraps them in whichever host's native agent format you use (Claude Code today, Kiro and Codex later). Each council runs on **your existing subscription** for that host — no API keys, no per-call billing.

## Quick start (Claude Code)

```
npm run build:claude-code
cp dist/claude-code/agents/*.md /path/to/your/project/.claude/agents/
```

Then in Claude Code, invoke whichever council fits your phase.

**Ideating a new project:**
```
@advisor-council-orchestrator I want to build a GMAT error dashboard that lets me upload missed questions, classify mistakes, and recommend drills.
```

**Trying to ship a partially-built project:**
```
@ship-council-orchestrator
goal: A weekly retro tool that texts me 3 questions every Sunday.
time_to_ship: by next Sunday.
audience: just me.
current_state: SMS send/receive works locally; LLM question generation works; no deploy yet.
```

## The two councils

### Advisor Council (ideation)

```
PM  →  Engineer  →  (User Evaluator + Critic in parallel)  →  Synthesizer
```

PM defines the product. Engineer responds with a concrete plan. User Evaluator and Critic both attack that plan in parallel. Synthesizer reconciles into one `FinalPlan`.

Output sections: final recommendation, what to build next, what not to build yet, major tradeoffs, open questions, one-week plan.

### Ship Council (final 20%)

```
Definition-of-Done
        │
        ▼
(Edge Case Auditor + Polish Inspector + Deployment Readiness in parallel)
        │
        ▼
Cut-or-Ship Critic  (triages everything: ship-blocker / post-ship / kill)
        │
        ▼
Ship Plan Synthesizer
```

The Ship Council orchestrator also reads your repo state automatically — `git status`, recent commits, README, deploy config — and feeds it into the audits. No need to summarize your own project.

Output sections: final verdict, shippable definition, ordered ship blockers, post-ship backlog, killed items, one-week ship plan, risks on ship day.

## Repository layout

```
prompts/         Shared, host-agnostic prompt bodies. {schema} is substituted at build time.
  advisor/         6 files (5 specialists + orchestrator)
  ship/            7 files (6 specialists + orchestrator)
schemas/         JSON Schema for each agent's structured output, organized by council.
  advisor/
  ship/
hosts/           Per-host packaging.
  claude-code/   Builds all councils into dist/claude-code/agents/
  kiro/          Placeholder
  codex/         Placeholder
dist/            Generated agent files. Gitignored.
examples/        Sample inputs for each council.
AGENTS.md        System overview and design principles.
```

## Host support

| Host | Advisor Council | Ship Council |
|---|---|---|
| Claude Code | ✅ | ✅ (uses tool access for repo gather) |
| Kiro | ⏳ Placeholder | ⏳ Placeholder (tool-use TBD) |
| Codex CLI | ⏳ Placeholder | ⏳ Placeholder (tool-use TBD) |

The Ship Council orchestrator uses `Read`, `Bash`, and `Glob` to gather repo state. Hosts that don't expose those tools fall back to a text-only mode (you supply `current_state` and `remaining_backlog` directly).

## Editing prompts

Edit `prompts/<council>/<name>.md` and re-run the relevant build. Keep the `{schema}` placeholder intact — the build script substitutes the matching JSON schema.

## Future councils (deferred)

- **Building Council** for the active build phase: direction checks, approach reviews, stuck-pattern recognizers. Deferred because the role overlaps with what Claude Code already does. Will be added — likely as standalone subagents, not a full council — once real build experience shows where the gap is.
- **Maintenance Council** for post-ship: postmortems, observability audits, deprecation planning. Speculative for now.

## License

MIT.
