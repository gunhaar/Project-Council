# Kiro packaging — placeholder

Kiro support is not yet implemented. The shared prompts in `prompts/` and schemas in `schemas/` are host-agnostic and ready to consume, but I have not yet verified Kiro's native agent file format (`--agent` mode).

## What needs to happen

1. Confirm Kiro's agent file format: where it expects files, what frontmatter or config keys it requires, how subagent invocation works, whether parallel sub-calls are supported.
2. Write `hosts/kiro/build.mjs` matching the Claude Code build script in spirit — read shared prompts, substitute `{schema}` placeholders, wrap in Kiro's format, write to `dist/kiro/`.
3. Decide how the orchestrator is invoked: as a Kiro agent, a Kiro spec, or a steering file.

## Until then

If you want to run the advisor board inside Kiro before this script exists, the cleanest workaround is to paste the contents of `prompts/orchestrator.md` (with the schemas inlined manually) as a Kiro agent prompt, and the five specialist prompts as separate Kiro agents that the orchestrator can call.
