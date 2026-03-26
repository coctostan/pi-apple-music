import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname } from "node:path";
import { type SpotifyConfig } from "./types.js";
import { SPOTIFY_CONFIG_FILE } from "./constants.js";

export function loadSpotifyConfig(): SpotifyConfig | null {
  if (!existsSync(SPOTIFY_CONFIG_FILE)) {
    return null;
  }
  try {
    const raw = readFileSync(SPOTIFY_CONFIG_FILE, "utf-8");
    const parsed: unknown = JSON.parse(raw);
    if (!isValidConfig(parsed)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveSpotifyConfig(config: SpotifyConfig): void {
  const dir = dirname(SPOTIFY_CONFIG_FILE);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(SPOTIFY_CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8");
}

export function isSpotifyConfigured(config: SpotifyConfig | null): config is SpotifyConfig {
  if (!config) return false;
  return (
    typeof config.clientId === "string" &&
    config.clientId.length > 0 &&
    typeof config.accessToken === "string" &&
    config.accessToken.length > 0
  );
}

function isValidConfig(value: unknown): value is SpotifyConfig {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;
  return typeof obj["clientId"] === "string";
}
