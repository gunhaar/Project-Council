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

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}
