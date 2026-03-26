#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import jwt from "jsonwebtoken";

const configPath = join(homedir(), ".pi-apple-music", "config.json");

let config;
try {
  config = JSON.parse(readFileSync(configPath, "utf-8"));
} catch {
  console.error(`Could not read config at ${configPath}`);
  console.error("Run: /apple-music config for setup instructions");
  process.exit(1);
}

const { teamId, keyId, privateKeyPath } = config;

if (!teamId || !keyId || !privateKeyPath) {
  console.error("Config missing teamId, keyId, or privateKeyPath");
  process.exit(1);
}

const privateKey = readFileSync(privateKeyPath, "utf-8");

const token = jwt.sign({}, privateKey, {
  algorithm: "ES256",
  expiresIn: "180d",
  issuer: teamId,
  header: {
    alg: "ES256",
    kid: keyId,
  },
  keyid: keyId,
});

console.log("\nDeveloper Token (copy this):\n");
console.log(token);
console.log("\nValid for 180 days. Paste into the get-token.html page.\n");
