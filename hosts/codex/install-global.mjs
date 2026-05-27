#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const DIST_SKILL = path.join(ROOT, "dist/codex/skills/project-council");
const CODEX_HOME = process.env.CODEX_HOME || path.join(os.homedir(), ".codex");
const GLOBAL_SKILL = path.join(CODEX_HOME, "skills/project-council");
const CONFIG = path.join(CODEX_HOME, "config.toml");

const AGENTS_BEGIN = "# BEGIN Project Council agents";
const AGENTS_END = "# END Project Council agents";
const LAUNCHER_BEGIN = "PROJECT_COUNCIL_LAUNCHER_BEGIN";
const LAUNCHER_END = "PROJECT_COUNCIL_LAUNCHER_END";

if (!fs.existsSync(path.join(DIST_SKILL, "SKILL.md"))) {
  throw new Error("Missing dist/codex/skills/project-council/SKILL.md. Run `npm run build:codex` first.");
}

fs.rmSync(GLOBAL_SKILL, { recursive: true, force: true });
copyDir(DIST_SKILL, GLOBAL_SKILL);

if (fs.existsSync(CONFIG)) {
  const before = fs.readFileSync(CONFIG, "utf8");
  const after = cleanupLegacyConfig(before);
  if (after !== before) {
    fs.writeFileSync(CONFIG, after);
    console.log(`Removed legacy Project Council config hooks from ${CONFIG}`);
  }
}

console.log(`Installed Project Council skill into ${GLOBAL_SKILL}`);

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name);
    const dest = path.join(to, entry.name);
    if (entry.isDirectory()) {
      copyDir(src, dest);
    } else if (entry.isFile()) {
      fs.copyFileSync(src, dest);
    }
  }
}

function cleanupLegacyConfig(config) {
  let next = config;
  next = removeManagedBlock(next, AGENTS_BEGIN, AGENTS_END);
  next = removeManagedDeveloperInstructions(next);
  return next.replace(/\n{3,}/gu, "\n\n").replace(/\s+$/u, "\n");
}

function removeManagedBlock(config, begin, end) {
  const pattern = new RegExp(`\\n?${escapeRegExp(begin)}[\\s\\S]*?${escapeRegExp(end)}\\n?`, "u");
  return config.replace(pattern, "\n");
}

function removeManagedDeveloperInstructions(config) {
  const launcherPattern = new RegExp(
    `^developer_instructions\\s*=\\s*'''\\n${escapeRegExp(LAUNCHER_BEGIN)}[\\s\\S]*?${escapeRegExp(LAUNCHER_END)}\\n'''\\n*`,
    "mu"
  );
  return config.replace(launcherPattern, "");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}
