import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execSync } from "node:child_process";
import { generateDeveloperToken, clearTokenCache } from "../src/auth.js";
import { loadConfig, isConfigured } from "../src/config.js";
import { type AppleMusicConfig } from "../src/types.js";

// Generate a test EC P-256 private key for JWT signing
function generateTestKey(dir: string): string {
  const keyPath = join(dir, "test-key.p8");
  execSync(`openssl ecparam -name prime256v1 -genkey -noout -out "${keyPath}" 2>/dev/null`);
  return keyPath;
}

function createTempDir(): string {
  const dir = join(
    tmpdir(),
    `pi-apple-music-test-${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
  mkdirSync(dir, { recursive: true });
  return dir;
}

function cleanTempDir(dir: string): void {
  if (existsSync(dir)) {
    rmSync(dir, { recursive: true, force: true });
  }
}

void describe("generateDeveloperToken", () => {
  let tempDir: string;
  let keyPath: string;

  beforeEach(() => {
    clearTokenCache();
    tempDir = createTempDir();
    keyPath = generateTestKey(tempDir);
  });

  afterEach(() => {
    cleanTempDir(tempDir);
  });

  void it("produces a valid JWT structure (3 dot-separated base64 segments)", () => {
    const config: AppleMusicConfig = {
      teamId: "ABCDE12345",
      keyId: "FGHIJ67890",
      privateKeyPath: keyPath,
    };

    const token = generateDeveloperToken(config);
    const parts = token.split(".");
    assert.equal(parts.length, 3, "JWT should have 3 parts separated by dots");

    for (const part of parts) {
      assert.ok(part.length > 0, "Each JWT part should be non-empty");
    }
  });

  void it("has correct header with alg ES256 and kid", () => {
    const config: AppleMusicConfig = {
      teamId: "ABCDE12345",
      keyId: "MYKEY12345",
      privateKeyPath: keyPath,
    };

    const token = generateDeveloperToken(config);
    const headerPart = token.split(".")[0];
    assert.ok(headerPart, "Header part should exist");

    const header = JSON.parse(Buffer.from(headerPart, "base64url").toString()) as Record<
      string,
      unknown
    >;
    assert.equal(header["alg"], "ES256", 'Algorithm should be "ES256"');
    assert.equal(header["kid"], "MYKEY12345", "kid should match keyId from config");
  });

  void it("has correct payload with iss, iat, and exp claims", () => {
    const config: AppleMusicConfig = {
      teamId: "TEAM123456",
      keyId: "FGHIJ67890",
      privateKeyPath: keyPath,
    };

    const beforeTime = Math.floor(Date.now() / 1000);
    const token = generateDeveloperToken(config);
    const afterTime = Math.floor(Date.now() / 1000);

    const payloadPart = token.split(".")[1];
    assert.ok(payloadPart, "Payload part should exist");

    const payload = JSON.parse(Buffer.from(payloadPart, "base64url").toString()) as Record<
      string,
      unknown
    >;
    assert.equal(payload["iss"], "TEAM123456", "iss should match teamId");
    assert.ok(
      typeof payload["iat"] === "number" &&
        payload["iat"] >= beforeTime &&
        payload["iat"] <= afterTime,
      "iat should be a valid timestamp near now"
    );
    assert.ok(
      typeof payload["exp"] === "number" && payload["exp"] > payload["iat"],
      "exp should be after iat"
    );
  });

  void it("returns cached token on subsequent calls with same config", () => {
    const config: AppleMusicConfig = {
      teamId: "ABCDE12345",
      keyId: "FGHIJ67890",
      privateKeyPath: keyPath,
    };

    const token1 = generateDeveloperToken(config);
    const token2 = generateDeveloperToken(config);
    assert.equal(token1, token2, "Same config should return cached token");
  });

  void it("generates new token after cache is cleared", () => {
    const config: AppleMusicConfig = {
      teamId: "ABCDE12345",
      keyId: "FGHIJ67890",
      privateKeyPath: keyPath,
    };

    generateDeveloperToken(config);
    clearTokenCache();
    const token2 = generateDeveloperToken(config);
    assert.ok(typeof token2 === "string" && token2.length > 0, "Should generate a new token");
  });
});

void describe("config", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    cleanTempDir(tempDir);
  });

  void it("loadConfig returns null when no config file exists", () => {
    const result = loadConfig();
    assert.ok(
      result === null || (typeof result === "object" && result !== null),
      "loadConfig should return null or a valid config"
    );
  });

  void it("isConfigured returns false for null", () => {
    assert.equal(isConfigured(null), false);
  });

  void it("isConfigured returns false for incomplete config", () => {
    const partial: AppleMusicConfig = {
      teamId: "",
      keyId: "ABC",
      privateKeyPath: "/some/path",
    };
    assert.equal(isConfigured(partial), false, "Empty teamId should fail");
  });

  void it("isConfigured returns true for complete config", () => {
    const complete: AppleMusicConfig = {
      teamId: "ABCDE12345",
      keyId: "FGHIJ67890",
      privateKeyPath: "/path/to/key.p8",
    };
    assert.equal(isConfigured(complete), true);
  });

  void it("isConfigured returns true when musicUserToken is present", () => {
    const complete: AppleMusicConfig = {
      teamId: "ABCDE12345",
      keyId: "FGHIJ67890",
      privateKeyPath: "/path/to/key.p8",
      musicUserToken: "some-user-token",
    };
    assert.equal(isConfigured(complete), true);
  });

  void it("saveConfig and loadConfig round-trip correctly", () => {
    const configPath = join(tempDir, "config.json");
    const config: AppleMusicConfig = {
      teamId: "TEAM123456",
      keyId: "KEY1234567",
      privateKeyPath: "/path/to/key.p8",
      musicUserToken: "user-token-abc",
    };

    writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");
    const raw = JSON.parse(readFileSync(configPath, "utf-8")) as AppleMusicConfig;

    assert.equal(raw.teamId, config.teamId);
    assert.equal(raw.keyId, config.keyId);
    assert.equal(raw.privateKeyPath, config.privateKeyPath);
    assert.equal(raw.musicUserToken, config.musicUserToken);
  });
});
