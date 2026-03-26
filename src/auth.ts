import { readFileSync } from "node:fs";
import jwt from "jsonwebtoken";
import { type AppleMusicConfig } from "./types.js";
import { MAX_TOKEN_LIFETIME_SECONDS } from "./constants.js";

interface CachedToken {
  token: string;
  expiresAt: number;
  configHash: string;
}

let cachedToken: CachedToken | null = null;

function configHash(config: AppleMusicConfig): string {
  return `${config.teamId}:${config.keyId}:${config.privateKeyPath}`;
}

export function generateDeveloperToken(config: AppleMusicConfig): string {
  const now = Math.floor(Date.now() / 1000);

  // Return cached token if still valid and config hasn't changed
  if (
    cachedToken &&
    cachedToken.expiresAt > now + 60 && // at least 60 seconds remaining
    cachedToken.configHash === configHash(config)
  ) {
    return cachedToken.token;
  }

  const privateKey = readFileSync(config.privateKeyPath, "utf-8");
  const exp = now + MAX_TOKEN_LIFETIME_SECONDS;

  const token = jwt.sign({}, privateKey, {
    algorithm: "ES256",
    expiresIn: MAX_TOKEN_LIFETIME_SECONDS,
    issuer: config.teamId,
    header: {
      alg: "ES256",
      kid: config.keyId,
    },
    keyid: config.keyId,
  });

  cachedToken = {
    token,
    expiresAt: exp,
    configHash: configHash(config),
  };

  return token;
}

/** Clear the cached token (useful for testing or config changes) */
export function clearTokenCache(): void {
  cachedToken = null;
}
