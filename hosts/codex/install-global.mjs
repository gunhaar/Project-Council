#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const DIST = path.join(ROOT, "dist/codex/.codex");
const DIST_AGENTS = path.join(DIST, "agents");
const CODEX_HOME = process.env.CODEX_HOME || path.join(os.homedir(), ".codex");
const GLOBAL_AGENTS = path.join(CODEX_HOME, "agents");
const CONFIG = path.join(CODEX_HOME, "config.toml");

const BEGIN = "# BEGIN Project Council agents";
const END = "# END Project Council agents";
const LAUNCHER_BEGIN = "PROJECT_COUNCIL_LAUNCHER_BEGIN";
const LAUNCHER_END = "PROJECT_COUNCIL_LAUNCHER_END";

if (!fs.existsSync(DIST_AGENTS)) {
  throw new Error("Missing dist/codex/.codex/agents. Run `npm run build:codex` first.");
}

fs.mkdirSync(GLOBAL_AGENTS, { recursive: true });

const agentFiles = fs
  .readdirSync(DIST_AGENTS)
  .filter((name) => name.endsWith(".toml"))
  .sort();

for (const file of agentFiles) {
  fs.copyFileSync(path.join(DIST_AGENTS, file), path.join(GLOBAL_AGENTS, file));
}

let config = fs.existsSync(CONFIG) ? fs.readFileSync(CONFIG, "utf8") : "";
const agentNames = agentFiles.map((file) => path.basename(file, ".toml"));
const launcherInstructions = [
  LAUNCHER_BEGIN,
  "Project Council launcher:",
  "",
  "If the latest user message contains `@ship-council-orchestrator`, `subagent://ship-council-orchestrator`, or an explicit request to run the Ship Council, treat that as a direct request to run the Ship Council. Do not ask for a target. The Ship Council is designed for zero-input repo inference.",
  `Read ${path.join(GLOBAL_AGENTS, "ship-council-orchestrator.toml")} and follow its developer_instructions. If it asks for specialist agents, read the named files from ${GLOBAL_AGENTS} and run those roles as separate subagent tasks when the multi-agent tool is available; otherwise execute the workflow locally and say that custom subagent dispatch was unavailable.`,
  "",
  "If the latest user message contains `@advisor-council-orchestrator`, `subagent://advisor-council-orchestrator`, or an explicit request to run the Advisor Council, treat that as a direct request to run the Advisor Council.",
  `Read ${path.join(GLOBAL_AGENTS, "advisor-council-orchestrator.toml")} and follow its developer_instructions. If it asks for specialist agents, read the named files from ${GLOBAL_AGENTS} and run those roles as separate subagent tasks when the multi-agent tool is available; otherwise execute the workflow locally and say that custom subagent dispatch was unavailable.`,
  LAUNCHER_END,
].join("\n");

config = upsertTopLevelDeveloperInstructions(config, launcherInstructions);

const block = [
  BEGIN,
  "[agents]",
  "max_threads = 8",
  "max_depth = 2",
  "",
  ...agentNames.flatMap((name) => [
    `[agents.${JSON.stringify(name)}]`,
    `config_file = ${JSON.stringify(`agents/${name}.toml`)}`,
    "",
  ]),
  END,
].join("\n");

const blockPattern = new RegExp(`${escapeRegExp(BEGIN)}[\\s\\S]*?${escapeRegExp(END)}`, "u");
if (blockPattern.test(config)) {
  config = config.replace(blockPattern, block);
} else {
  if (/^\[agents(?:\.|\])/mu.test(config)) {
    throw new Error(
      `${CONFIG} already has an unmanaged [agents] section. Merge dist/codex/.codex/config.toml manually.`
    );
  }
  config = `${config.replace(/\s+$/u, "")}\n\n${block}\n`;
}

fs.writeFileSync(CONFIG, config);

console.log(`Installed ${agentFiles.length} Project Council agents into ${GLOBAL_AGENTS}`);
console.log(`Updated ${CONFIG}`);

function upsertTopLevelDeveloperInstructions(config, managedText) {
  const managedPattern = new RegExp(`${escapeRegExp(LAUNCHER_BEGIN)}[\\s\\S]*?${escapeRegExp(LAUNCHER_END)}`, "u");
  if (managedPattern.test(config)) {
    return config.replace(managedPattern, managedText);
  }

  const firstTableIndex = config.search(/^\[/mu);
  const topLevelPrefix = firstTableIndex === -1 ? config : config.slice(0, firstTableIndex);
  if (/^developer_instructions\s*=/mu.test(topLevelPrefix)) {
    throw new Error(
      `${CONFIG} already has unmanaged top-level developer_instructions. Merge the Project Council launcher manually.`
    );
  }

  const insertion = `developer_instructions = ${tomlMultilineLiteral(managedText)}\n\n`;
  if (firstTableIndex === -1) {
    return `${config.replace(/\s+$/u, "")}\n${insertion}`;
  }
  return `${config.slice(0, firstTableIndex)}${insertion}${config.slice(firstTableIndex)}`;
}

function tomlMultilineLiteral(value) {
  if (value.includes("'''")) {
    throw new Error("Cannot emit TOML literal string containing triple single quotes");
  }
  return `'''\n${value.replace(/\s+$/u, "")}\n'''`;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}
