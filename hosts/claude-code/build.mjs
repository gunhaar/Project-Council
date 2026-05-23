#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const PROMPTS = path.join(ROOT, "prompts");
const SCHEMAS = path.join(ROOT, "schemas");
const OUT = path.join(ROOT, "dist/claude-code/agents");

const agents = [
  {
    name: "pm-agent",
    prompt: "pm",
    schema: "pm",
    description:
      "Pragmatic PM. Scopes the MVP and names riskiest assumptions. Returns PMOutput JSON. Invoke as the first specialist in the Startup Advisor Board workflow.",
  },
  {
    name: "engineer-agent",
    prompt: "engineer",
    schema: "engineer",
    description:
      "Senior engineer. Proposes simplest architecture for PM scope. Returns EngineerOutput JSON. Invoke after the PM agent, with PM's output as input.",
  },
  {
    name: "user-evaluator-agent",
    prompt: "user-evaluator",
    schema: "user-evaluator",
    description:
      "UX evaluator. Finds friction and magic moments in the plan. Returns UserEvalOutput JSON. Invoke in parallel with the critic agent, after PM and Engineer.",
  },
  {
    name: "critic-agent",
    prompt: "critic",
    schema: "critic",
    description:
      "Skeptical critic. Names the hard truth and what to cut. Returns CriticOutput JSON. Invoke in parallel with the user-evaluator agent.",
  },
  {
    name: "synthesizer-agent",
    prompt: "synthesizer",
    schema: "final-plan",
    description:
      "Synthesizer. Reconciles all four specialists into FinalPlan JSON. Invoke last, after PM, Engineer, User Evaluator, and Critic have all returned.",
  },
  {
    name: "startup-advisor-orchestrator",
    prompt: "orchestrator",
    schema: null,
    description:
      "Orchestrates the Startup Advisor Board: sequences PM, Engineer, User Evaluator, Critic, and Synthesizer subagents to produce a project plan. Invoke this agent when the user wants a structured critique and plan for a project idea.",
    tools: "Task, Read",
  },
];

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

for (const a of agents) {
  let body = fs.readFileSync(path.join(PROMPTS, `${a.prompt}.md`), "utf8");

  if (a.schema) {
    const schemaPath = path.join(SCHEMAS, `${a.schema}.schema.json`);
    const schemaJson = JSON.parse(fs.readFileSync(schemaPath, "utf8"));
    const block = "```json\n" + JSON.stringify(schemaJson, null, 2) + "\n```";
    if (!body.includes("{schema}")) {
      throw new Error(`prompts/${a.prompt}.md is missing the {schema} placeholder`);
    }
    body = body.replace("{schema}", block);
  }

  const fmLines = [
    "---",
    `name: ${a.name}`,
    `description: ${a.description}`,
  ];
  if (a.tools) fmLines.push(`tools: ${a.tools}`);
  fmLines.push("---", "", "");

  const out = fmLines.join("\n") + body;
  const outPath = path.join(OUT, `${a.name}.md`);
  fs.writeFileSync(outPath, out);
  console.log(`wrote ${path.relative(ROOT, outPath)}`);
}

console.log(`\nDone. Copy ${path.relative(ROOT, OUT)}/*.md into your project's .claude/agents/ directory.`);
