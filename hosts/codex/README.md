# Codex packaging

Builds the shared prompts in `prompts/` and schemas in `schemas/` into Codex custom subagent files.

Codex custom agents are TOML files under `.codex/agents/`. Each file defines one custom subagent with its own developer instructions, which lets Codex spawn each specialist in a separate context window and aggregate the results in the orchestrator.

## Build

```
npm run build:codex
```

Output lands in `dist/codex/.codex/`:

```
dist/codex/.codex/
  config.toml
  agents/
    pm-agent.toml
    engineer-agent.toml
    user-evaluator-agent.toml
    critic-agent.toml
    synthesizer-agent.toml
    startup-advisor-orchestrator.toml
```

## Deploy To A Project

Copy the generated `.codex` directory into the project where you want to use the advisor board:

```
cp -R dist/codex/.codex /path/to/your/project/
```

If that project already has a `.codex/config.toml`, merge the generated `[agents]` settings and `[agents."<name>"]` `config_file` entries instead of replacing the existing config.

Make sure the target project is trusted by Codex. Project-local `.codex/` config only loads for trusted projects. In the Codex CLI or app, open the target project and accept the trust prompt if one appears.

## Run

From the target project, ask Codex to use the orchestrator:

```
Use the startup-advisor-orchestrator subagent for this idea: I want to build a GMAT error dashboard that lets me upload missed questions, classify mistakes, and recommend drills.
```

The orchestrator should spawn `pm-agent`, then `engineer-agent`, then `user-evaluator-agent` and `critic-agent` in parallel, and finally `synthesizer-agent`. Each spawned specialist runs as a separate Codex subagent thread with its own context window. The orchestrator passes only the required upstream JSON into each downstream specialist.

## Smoke Test

You can test that Codex loaded the generated package by running from the deployed project:

```
codex exec --json "Spawn the custom subagent named pm-agent with fork_context=false. Ask it to evaluate this ProjectContext and return only its schema JSON: {\"idea\":\"tiny freelancer email follow-up scheduler\",\"constraints\":[\"solo builder\",\"one week MVP\"],\"notes\":\"Codex custom agent smoke test.\"}"
```

A healthy install returns a JSON object with the PM schema fields: `target_user`, `core_problem`, `p0_features`, `p1_features`, `riskiest_assumptions`, and `recommended_next_step`.

For a full workflow test:

```
codex exec --json "Spawn the custom subagent named startup-advisor-orchestrator with fork_context=false. Give it this project idea: a tiny app that lets freelancers paste client emails and get a suggested polite follow-up schedule. Follow the full Startup Advisor Board workflow and include the raw FinalPlan JSON."
```

A healthy run produces `FinalPlan` JSON and the Codex transcript should show separate spawned roles for `startup-advisor-orchestrator`, `pm-agent`, `engineer-agent`, `user-evaluator-agent`, `critic-agent`, and `synthesizer-agent`.

## Notes

- `config.toml` sets `[agents].max_threads = 8` and `max_depth = 2`, enough for a spawned orchestrator to fan out to the five specialist subagents.
- `config.toml` also registers each custom agent with `agents.<name>.config_file`, which current Codex CLI builds need in order to spawn project-local custom agents by name.
- The target project must be trusted by Codex for project-local `.codex/` config to load.
- The generated specialist files embed their JSON schemas directly in `developer_instructions`, so they can return valid structured JSON without reading this repository.
- The generated orchestrator also embeds every validation schema, so it can validate specialist output after installation in any project.
- The specialist names intentionally match the existing Claude Code agent names to keep the shared orchestrator prompt host-agnostic.
