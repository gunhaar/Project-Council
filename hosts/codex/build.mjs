#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const PROMPTS = path.join(ROOT, "prompts");
const SCHEMAS = path.join(ROOT, "schemas");
const OUT = path.join(ROOT, "dist/codex/.codex");
const AGENTS_OUT = path.join(OUT, "agents");

const councils = [
  {
    council: "advisor",
    displayName: "Advisor Council",
    agentNames: [
      "pm-agent",
      "engineer-agent",
      "user-evaluator-agent",
      "critic-agent",
      "synthesizer-agent",
    ],
    schemaNames: ["pm", "engineer", "user-evaluator", "critic", "final-plan"],
    agents: [
      {
        name: "pm-agent",
        prompt: "pm",
        schema: "pm",
        description:
          "Pragmatic PM for the Advisor Council. Scopes the MVP and names riskiest assumptions. Returns PMOutput JSON.",
        nickname_candidates: ["PM Scout", "Scope Lead", "MVP Lens"],
      },
      {
        name: "engineer-agent",
        prompt: "engineer",
        schema: "engineer",
        description:
          "Senior engineer for the Advisor Council. Proposes the simplest architecture after PM scope. Returns EngineerOutput JSON.",
        nickname_candidates: ["Build Lead", "Architecture Lens", "Tech Scout"],
      },
      {
        name: "user-evaluator-agent",
        prompt: "user-evaluator",
        schema: "user-evaluator",
        description:
          "UX evaluator for the Advisor Council. Finds friction, magic moments, and retention hooks. Returns UserEvalOutput JSON.",
        nickname_candidates: ["UX Lens", "Friction Finder", "User Scout"],
      },
      {
        name: "critic-agent",
        prompt: "critic",
        schema: "critic",
        description:
          "Skeptical critic for the Advisor Council. Names the hard truth and what to cut. Returns CriticOutput JSON.",
        nickname_candidates: ["Reality Check", "Risk Lens", "Cut Lead"],
      },
      {
        name: "synthesizer-agent",
        prompt: "synthesizer",
        schema: "final-plan",
        description:
          "Senior partner for the Advisor Council. Reconciles all specialist outputs into FinalPlan JSON.",
        nickname_candidates: ["Synthesis Lead", "Final Plan", "Partner Lens"],
      },
      {
        name: "advisor-council-orchestrator",
        prompt: "orchestrator",
        schema: null,
        description:
          "Orchestrates the Advisor Council by spawning PM, Engineer, User Evaluator, Critic, and Synthesizer subagents with isolated contexts.",
        nickname_candidates: ["Advisor Council", "Board Chair", "Orchestrator"],
      },
    ],
  },
  {
    council: "ship",
    displayName: "Ship Council",
    agentNames: [
      "definition-of-done-agent",
      "edge-case-auditor",
      "polish-inspector",
      "deployment-readiness-agent",
      "cut-or-ship-critic",
      "ship-plan-synthesizer",
    ],
    schemaNames: [
      "definition-of-done",
      "edge-case-auditor",
      "polish-inspector",
      "deployment-readiness",
      "cut-or-ship-critic",
      "ship-plan",
    ],
    agents: [
      {
        name: "definition-of-done-agent",
        prompt: "definition-of-done",
        schema: "definition-of-done",
        description:
          "Defines the shippable finish line for a project. Returns DefinitionOfDone JSON. Invoked first by the Ship Council orchestrator.",
        nickname_candidates: ["Finish Line", "Done Lens", "Scope Setter"],
      },
      {
        name: "edge-case-auditor",
        prompt: "edge-case-auditor",
        schema: "edge-case-auditor",
        description:
          "Walks the user journey looking for unhappy paths the build skipped. Returns EdgeCaseAudit JSON.",
        nickname_candidates: ["Edge Cases", "Journey Audit", "Unhappy Paths"],
      },
      {
        name: "polish-inspector",
        prompt: "polish-inspector",
        schema: "polish-inspector",
        description:
          "Audits last-mile UX gaps: loading states, empty states, error states, mobile, copy, accessibility. Returns PolishAudit JSON.",
        nickname_candidates: ["Polish Pass", "UX Finish", "Last Mile"],
      },
      {
        name: "deployment-readiness-agent",
        prompt: "deployment-readiness",
        schema: "deployment-readiness",
        description:
          "Audits production readiness: hosting, secrets, logging, monitoring, rollback, deploy automation. Returns DeploymentReadiness JSON.",
        nickname_candidates: ["Deploy Check", "Production Lens", "Ops Readiness"],
      },
      {
        name: "cut-or-ship-critic",
        prompt: "cut-or-ship-critic",
        schema: "cut-or-ship-critic",
        description:
          "Brutal triage agent. Sorts audits and remaining backlog into ship-blocker, post-ship, or kill. Returns CutOrShip JSON.",
        nickname_candidates: ["Ship Critic", "Triage Lead", "Cut List"],
      },
      {
        name: "ship-plan-synthesizer",
        prompt: "ship-plan-synthesizer",
        schema: "ship-plan",
        description:
          "Synthesizes audits and cut-or-ship triage into an actionable ShipPlan JSON.",
        nickname_candidates: ["Ship Plan", "Launch Lead", "Synthesis Lead"],
      },
      {
        name: "ship-council-orchestrator",
        prompt: "orchestrator",
        schema: null,
        description:
          "Orchestrates the Ship Council by gathering repo state, running a runtime walkthrough, and spawning the shipping specialists.",
        nickname_candidates: ["Ship Council", "Launch Chair", "Ship Orchestrator"],
      },
    ],
  },
];

function tomlString(value) {
  return JSON.stringify(value);
}

function tomlStringArray(values) {
  return `[${values.map(tomlString).join(", ")}]`;
}

function tomlMultilineLiteral(value) {
  if (value.includes("'''")) {
    throw new Error("Cannot emit TOML literal string containing triple single quotes");
  }
  return `'''\n${value.replace(/\s+$/u, "")}\n'''`;
}

function schemaBlock(council, schema) {
  const schemaPath = path.join(SCHEMAS, council, `${schema}.schema.json`);
  const schemaJson = JSON.parse(fs.readFileSync(schemaPath, "utf8"));
  return "```json\n" + JSON.stringify(schemaJson, null, 2) + "\n```";
}

function promptWithSchema(council, agent) {
  let body = fs.readFileSync(path.join(PROMPTS, council, `${agent.prompt}.md`), "utf8");

  if (agent.schema) {
    if (!body.includes("{schema}")) {
      throw new Error(`prompts/${council}/${agent.prompt}.md is missing the {schema} placeholder`);
    }
    body = body.replace("{schema}", schemaBlock(council, agent.schema));
  }

  return body;
}

function codexInstructions(councilConfig, agent) {
  let body = promptWithSchema(councilConfig.council, agent);

  if (agent.name.endsWith("-orchestrator")) {
    const agentList = councilConfig.agentNames.map((name) => `\`${name}\``).join(", ");
    const schemaBlocks = councilConfig.schemaNames
      .map((name) => `### ${councilConfig.council}/${name}.schema.json\n\n${schemaBlock(councilConfig.council, name)}`)
      .join("\n\n");

    body += `\n\n## Codex packaging notes\n\n- Invoke the ${councilConfig.displayName} specialist custom subagents by exact name: ${agentList}.\n- Each specialist invocation must be a separate subagent run with its own context window. Do not simulate a specialist in this orchestrator context.\n- Use the embedded schemas below for validation; do not assume the target project has this repository's \`schemas/\` directory.\n\n## Embedded validation schemas\n\n${schemaBlocks}`;
  }

  return body;
}

const agents = councils.flatMap((councilConfig) =>
  councilConfig.agents.map((agent) => ({ ...agent, councilConfig }))
);
const names = new Set();
for (const { name } of agents) {
  if (names.has(name)) {
    throw new Error(`Agent name collision: ${name}`);
  }
  names.add(name);
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(AGENTS_OUT, { recursive: true });

const config = `# Generated by hosts/codex/build.mjs.
# Copy this directory to a project root so Codex can load the Project Council subagents.

[agents]
max_threads = 8
max_depth = 2

${agents
  .map(
    ({ name }) => `[agents.${tomlString(name)}]
config_file = ${tomlString(`agents/${name}.toml`)}`
  )
  .join("\n\n")}
`;

fs.writeFileSync(path.join(OUT, "config.toml"), config);
console.log(`wrote ${path.relative(ROOT, path.join(OUT, "config.toml"))}`);

for (const { councilConfig, ...agent } of agents) {
  const body = codexInstructions(councilConfig, agent);
  const lines = [
    "# Generated by hosts/codex/build.mjs. Do not edit this file directly.",
    `name = ${tomlString(agent.name)}`,
    `description = ${tomlString(agent.description)}`,
    `nickname_candidates = ${tomlStringArray(agent.nickname_candidates)}`,
    "developer_instructions = " + tomlMultilineLiteral(body),
    "",
  ];

  const outPath = path.join(AGENTS_OUT, `${agent.name}.toml`);
  fs.writeFileSync(outPath, lines.join("\n"));
  console.log(`wrote ${path.relative(ROOT, outPath)}`);
}

console.log(`\nDone. Copy ${path.relative(ROOT, OUT)}/ into your project root, or copy its contents into an existing .codex/ directory.`);
