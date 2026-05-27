#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const PROMPTS = path.join(ROOT, "prompts");
const SCHEMAS = path.join(ROOT, "schemas");
const OUT = path.join(ROOT, "dist/claude-code/agents");

const councils = [
  {
    council: "advisor",
    agents: [
      {
        name: "pm-agent",
        prompt: "pm",
        schema: "pm",
        description:
          "Pragmatic PM. Scopes the MVP and names riskiest assumptions. Returns PMOutput JSON. Invoked by the Advisor Council orchestrator.",
      },
      {
        name: "engineer-agent",
        prompt: "engineer",
        schema: "engineer",
        description:
          "Senior engineer. Proposes simplest architecture for PM scope. Returns EngineerOutput JSON. Invoked by the Advisor Council orchestrator after PM.",
      },
      {
        name: "user-evaluator-agent",
        prompt: "user-evaluator",
        schema: "user-evaluator",
        description:
          "UX evaluator. Finds friction and magic moments in the plan. Returns UserEvalOutput JSON. Invoked in parallel with the critic agent.",
      },
      {
        name: "critic-agent",
        prompt: "critic",
        schema: "critic",
        description:
          "Skeptical critic. Names the hard truth and what to cut. Returns CriticOutput JSON. Invoked in parallel with the user-evaluator agent.",
      },
      {
        name: "advisor-council-orchestrator",
        prompt: "orchestrator",
        schema: "final-plan",
        description:
          "Orchestrates the Advisor Council: sequences PM, Engineer, User Evaluator, and Critic, then synthesizes a project plan. Invoke when the user wants a structured critique and plan for a project idea.",
        tools: "Task, Read",
      },
    ],
  },
  {
    council: "ship",
    agents: [
      {
        name: "definition-of-done-agent",
        prompt: "definition-of-done",
        schema: "definition-of-done",
        description:
          "Defines the shippable finish line for a project. Returns DefinitionOfDone JSON. Invoked first by the Ship Council orchestrator.",
      },
      {
        name: "edge-case-auditor",
        prompt: "edge-case-auditor",
        schema: "edge-case-auditor",
        description:
          "Walks the user journey looking for unhappy paths the build skipped. Returns EdgeCaseAudit JSON. Invoked in parallel with polish-inspector and deployment-readiness-agent.",
      },
      {
        name: "polish-inspector",
        prompt: "polish-inspector",
        schema: "polish-inspector",
        description:
          "Audits last-mile UX gaps: loading states, empty states, error states, mobile, copy, accessibility. Returns PolishAudit JSON.",
      },
      {
        name: "deployment-readiness-agent",
        prompt: "deployment-readiness",
        schema: "deployment-readiness",
        description:
          "Audits production readiness: hosting, secrets, logging, monitoring, rollback, deploy automation. Returns DeploymentReadiness JSON.",
      },
      {
        name: "cut-or-ship-critic",
        prompt: "cut-or-ship-critic",
        schema: "cut-or-ship-critic",
        description:
          "Brutal triage agent. Sorts audits + remaining backlog into ship-blocker / post-ship / kill. Returns CutOrShip JSON.",
      },
      {
        name: "ship-plan-synthesizer",
        prompt: "ship-plan-synthesizer",
        schema: "ship-plan",
        description:
          "Synthesizes the three audits and the cut-or-ship triage into an actionable ShipPlan JSON.",
      },
      {
        name: "ship-council-orchestrator",
        prompt: "orchestrator",
        schema: null,
        description:
          "Orchestrates the Ship Council: gathers repo state, sequences Definition-of-Done, three parallel audits, Cut-or-Ship Critic, and Ship Plan Synthesizer. Invoke when a project is in the final-20% shipping phase.",
        tools: "Task, Read, Bash, Glob",
      },
    ],
  },
];

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const written = new Set();

for (const { council, agents } of councils) {
  for (const a of agents) {
    const promptPath = path.join(PROMPTS, council, `${a.prompt}.md`);
    let body = fs.readFileSync(promptPath, "utf8");

    if (a.schema) {
      const schemaPath = path.join(SCHEMAS, council, `${a.schema}.schema.json`);
      const schemaJson = JSON.parse(fs.readFileSync(schemaPath, "utf8"));
      const block = "```json\n" + JSON.stringify(schemaJson, null, 2) + "\n```";
      if (!body.includes("{schema}")) {
        throw new Error(`prompts/${council}/${a.prompt}.md is missing the {schema} placeholder`);
      }
      body = body.replace("{schema}", block);
    }

    const fmLines = ["---", `name: ${a.name}`, `description: ${a.description}`];
    if (a.tools) fmLines.push(`tools: ${a.tools}`);
    fmLines.push("---", "", "");

    const outPath = path.join(OUT, `${a.name}.md`);
    if (written.has(a.name)) {
      throw new Error(`Filename collision: ${a.name}.md is defined twice. Rename one of the agents.`);
    }
    written.add(a.name);

    fs.writeFileSync(outPath, fmLines.join("\n") + body);
    console.log(`wrote ${path.relative(ROOT, outPath)}`);
  }
}

console.log(`\nDone. Copy ${path.relative(ROOT, OUT)}/*.md into your project's .claude/agents/ directory.`);
