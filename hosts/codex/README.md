# Codex CLI packaging — placeholder

Codex CLI support is not yet implemented. Codex's non-interactive mode (`codex exec`) is well-suited to running individual specialist prompts, but its subagent / multi-agent orchestration story is less mature than Claude Code's — there is no direct equivalent of `.claude/agents/` that I want to commit to without verifying.

## Workarounds for now

- **Single-shot specialists.** Pipe one of the prompt bodies in `prompts/` into `codex exec` along with a project context. You'll get the JSON output for that one role. Useful for ad-hoc consultations.
- **Manual orchestration.** Run PM, then Engineer, then User Evaluator and Critic, then Synthesizer in sequence, copying each output as input to the next. Tedious but works.

## What would unblock proper packaging

Either (a) Codex CLI adds a subagent file convention, or (b) we add a thin Node runner that shells out to `codex exec` per stage and validates outputs against the schemas. The latter would re-introduce a runtime component we deliberately avoided in v1.
