import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname } from "node:path";
import { type AppleMusicConfig } from "./types.js";
import { CONFIG_DIR, CONFIG_FILE } from "./constants.js";

export function loadConfig(): AppleMusicConfig | null {
  if (!existsSync(CONFIG_FILE)) {
    return null;
  }
  try {
    const raw = readFileSync(CONFIG_FILE, "utf-8");
    const parsed: unknown = JSON.parse(raw);
    if (!isValidConfig(parsed)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveConfig(config: AppleMusicConfig): void {
  const dir = dirname(CONFIG_FILE);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8");
}

export function isConfigured(config: AppleMusicConfig | null): config is AppleMusicConfig {
  if (!config) return false;
  return (
    typeof config.teamId === "string" &&
    config.teamId.length > 0 &&
    typeof config.keyId === "string" &&
    config.keyId.length > 0 &&
    typeof config.privateKeyPath === "string" &&
    config.privateKeyPath.length > 0
  );
}

export function getConfigDir(): string {
  return CONFIG_DIR;
}

function isValidConfig(value: unknown): value is AppleMusicConfig {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj["teamId"] === "string" &&
    typeof obj["keyId"] === "string" &&
    typeof obj["privateKeyPath"] === "string"
  );
}
