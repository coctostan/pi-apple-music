import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { isTokenExpired, generatePKCEChallenge, buildAuthURL, refreshAccessToken } from "../src/spotify/auth.js";
import { type SpotifyConfig } from "../src/spotify/types.js";

describe("isTokenExpired", () => {
  it("returns true when expiresAt is undefined", () => {
    const config: SpotifyConfig = { clientId: "test" };
    assert.equal(isTokenExpired(config), true);
  });

  it("returns true when token is expired", () => {
    const config: SpotifyConfig = {
      clientId: "test",
      expiresAt: Math.floor(Date.now() / 1000) - 100,
    };
    assert.equal(isTokenExpired(config), true);
  });

  it("returns true when token expires within 60 seconds", () => {
    const config: SpotifyConfig = {
      clientId: "test",
      expiresAt: Math.floor(Date.now() / 1000) + 30,
    };
    assert.equal(isTokenExpired(config), true);
  });

  it("returns false when token has more than 60 seconds remaining", () => {
    const config: SpotifyConfig = {
      clientId: "test",
      expiresAt: Math.floor(Date.now() / 1000) + 3600,
    };
    assert.equal(isTokenExpired(config), false);
  });
});

describe("generatePKCEChallenge", () => {
  it("produces a code verifier between 43 and 128 characters", () => {
    const { codeVerifier } = generatePKCEChallenge();
    assert.ok(codeVerifier.length >= 43, `verifier too short: ${codeVerifier.length}`);
    assert.ok(codeVerifier.length <= 128, `verifier too long: ${codeVerifier.length}`);
  });

  it("produces a base64url-encoded code challenge", () => {
    const { codeChallenge } = generatePKCEChallenge();
    // base64url uses only alphanumeric, hyphen, underscore (no +, /, =)
    assert.ok(/^[A-Za-z0-9_-]+$/.test(codeChallenge), `invalid base64url: ${codeChallenge}`);
  });

  it("produces unique values on each call", () => {
    const a = generatePKCEChallenge();
    const b = generatePKCEChallenge();
    assert.notEqual(a.codeVerifier, b.codeVerifier);
    assert.notEqual(a.codeChallenge, b.codeChallenge);
  });
});

describe("buildAuthURL", () => {
  it("includes all required parameters", () => {
    const url = buildAuthURL("my-client-id", "http://localhost:8888/callback", "test-challenge");
    assert.ok(url.startsWith("https://accounts.spotify.com/authorize?"));
    assert.ok(url.includes("response_type=code"));
    assert.ok(url.includes("client_id=my-client-id"));
    assert.ok(url.includes("redirect_uri="));
    assert.ok(url.includes("code_challenge_method=S256"));
    assert.ok(url.includes("code_challenge=test-challenge"));
    assert.ok(url.includes("scope="));
    // Check some scopes are present
    assert.ok(url.includes("user-library-read"));
    assert.ok(url.includes("playlist-modify-public"));
  });
});

describe("refreshAccessToken", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("returns new access token on success", async () => {
    globalThis.fetch = async (_url: string | URL | Request, _init?: RequestInit) => {
      return new Response(
        JSON.stringify({
          access_token: "new-access-token",
          token_type: "Bearer",
          expires_in: 3600,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    };

    const config: SpotifyConfig = {
      clientId: "test-client",
      refreshToken: "test-refresh-token",
    };

    const result = await refreshAccessToken(config);
    assert.equal(result.accessToken, "new-access-token");
    assert.ok(result.expiresAt > Math.floor(Date.now() / 1000));
  });

  it("throws on failed refresh", async () => {
    globalThis.fetch = async (_url: string | URL | Request, _init?: RequestInit) => {
      return new Response("invalid_grant", { status: 400, statusText: "Bad Request" });
    };

    const config: SpotifyConfig = {
      clientId: "test-client",
      refreshToken: "expired-refresh-token",
    };

    await assert.rejects(
      () => refreshAccessToken(config),
      (err: Error) => {
        assert.ok(err.message.includes("400"));
        assert.ok(err.message.includes("invalid_grant"));
        return true;
      }
    );
  });

  it("throws when no refresh token available", async () => {
    const config: SpotifyConfig = { clientId: "test-client" };
    await assert.rejects(
      () => refreshAccessToken(config),
      (err: Error) => {
        assert.ok(err.message.includes("no refresh token"));
        return true;
      }
    );
  });

  it("sends correct form-encoded body", async () => {
    let capturedBody = "";
    globalThis.fetch = async (_url: string | URL | Request, init?: RequestInit) => {
      capturedBody = init?.body as string;
      return new Response(
        JSON.stringify({ access_token: "tok", expires_in: 3600 }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    };

    const config: SpotifyConfig = {
      clientId: "my-client",
      refreshToken: "my-refresh",
    };

    await refreshAccessToken(config);
    assert.ok(capturedBody.includes("grant_type=refresh_token"));
    assert.ok(capturedBody.includes("refresh_token=my-refresh"));
    assert.ok(capturedBody.includes("client_id=my-client"));
  });
});
