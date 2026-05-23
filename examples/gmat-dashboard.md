# Example: GMAT error dashboard

Use this as a test input for the orchestrator.

## Idea

I want to build a GMAT error dashboard that lets me upload missed questions, classify mistakes (careless, conceptual, time-pressure, knowledge-gap), and recommend targeted drills.

## Constraints

- Solo developer.
- One week of evening time.
- Personal tool first; might open it up later.

## Notes

I already have a folder of screenshots of missed questions. I prefer Python on the backend; I do not care about the frontend stack. I want to learn something from this build.

---

To run the board on this input inside Claude Code (once the agents are installed in `.claude/agents/`):

```
@startup-advisor-orchestrator Use the project context in examples/gmat-dashboard.md.
```

Or just paste the idea, constraints, and notes directly into the chat.
