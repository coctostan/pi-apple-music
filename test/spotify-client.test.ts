import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { createSpotifyClient } from "../src/spotify/spotify-client.js";
import { type SpotifyConfig } from "../src/spotify/types.js";

describe("SpotifyClient", () => {
  const originalFetch = globalThis.fetch;
  let savedConfigs: SpotifyConfig[];

  function makeSaveConfig(): (config: SpotifyConfig) => void {
    savedConfigs = [];
    return (config: SpotifyConfig) => {
      savedConfigs.push(config);
    };
  }

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe("get", () => {
    it("sends correct headers and returns parsed JSON", async () => {
      let capturedHeaders: Record<string, string> = {};
      let capturedUrl = "";

      globalThis.fetch = async (url: string | URL | Request, init?: RequestInit) => {
        capturedUrl = url.toString();
        capturedHeaders = Object.fromEntries(
          Object.entries(init?.headers as Record<string, string>)
        );
        return new Response(JSON.stringify({ items: [1, 2, 3] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      };

      const config: SpotifyConfig = {
        clientId: "test",
        accessToken: "my-token",
        expiresAt: Math.floor(Date.now() / 1000) + 3600,
      };

      const client = createSpotifyClient(config, makeSaveConfig());
      const result = await client.get("/v1/me/tracks");

      assert.equal(capturedUrl, "https://api.spotify.com/v1/me/tracks");
      assert.equal(capturedHeaders["Authorization"], "Bearer my-token");
      assert.equal(capturedHeaders["Content-Type"], "application/json");
      assert.deepEqual(result, { items: [1, 2, 3] });
    });
  });

  describe("post", () => {
    it("sends body and correct headers", async () => {
      let capturedBody = "";

      globalThis.fetch = async (_url: string | URL | Request, init?: RequestInit) => {
        capturedBody = init?.body as string;
        return new Response(JSON.stringify({ id: "playlist-1" }), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        });
      };

      const config: SpotifyConfig = {
        clientId: "test",
        accessToken: "my-token",
        expiresAt: Math.floor(Date.now() / 1000) + 3600,
      };

      const client = createSpotifyClient(config, makeSaveConfig());
      const result = await client.post("/v1/users/user1/playlists", { name: "My Playlist" });

      assert.deepEqual(JSON.parse(capturedBody), { name: "My Playlist" });
      assert.deepEqual(result, { id: "playlist-1" });
    });

    it("returns null for 204 responses", async () => {
      globalThis.fetch = async (_url: string | URL | Request, _init?: RequestInit) => {
        return new Response(null, { status: 204 });
      };

      const config: SpotifyConfig = {
        clientId: "test",
        accessToken: "my-token",
        expiresAt: Math.floor(Date.now() / 1000) + 3600,
      };

      const client = createSpotifyClient(config, makeSaveConfig());
      const result = await client.post("/v1/playlists/123/tracks", { uris: [] });
      assert.equal(result, null);
    });
  });

  describe("auto-refresh", () => {
    it("refreshes token before request when expired", async () => {
      let callCount = 0;

      globalThis.fetch = async (url: string | URL | Request, _init?: RequestInit) => {
        callCount++;
        const urlStr = url.toString();

        if (urlStr.includes("accounts.spotify.com/api/token")) {
          // Token refresh call
          return new Response(
            JSON.stringify({
              access_token: "refreshed-token",
              expires_in: 3600,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }

        // API call — verify the refreshed token is used
        const headers = _init?.headers as Record<string, string>;
        assert.equal(headers["Authorization"], "Bearer refreshed-token");

        return new Response(JSON.stringify({ data: "ok" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      };

      const config: SpotifyConfig = {
        clientId: "test-client",
        accessToken: "expired-token",
        refreshToken: "valid-refresh",
        expiresAt: Math.floor(Date.now() / 1000) - 100, // expired
      };

      const saveConfig = makeSaveConfig();
      const client = createSpotifyClient(config, saveConfig);
      const result = await client.get("/v1/me/tracks");

      assert.equal(callCount, 2); // refresh + API call
      assert.deepEqual(result, { data: "ok" });
      assert.equal(savedConfigs.length, 1);
      assert.equal(savedConfigs[0]!.accessToken, "refreshed-token");
    });

    it("does not refresh when token is valid", async () => {
      let callCount = 0;

      globalThis.fetch = async (_url: string | URL | Request, _init?: RequestInit) => {
        callCount++;
        return new Response(JSON.stringify({ data: "ok" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      };

      const config: SpotifyConfig = {
        clientId: "test",
        accessToken: "valid-token",
        expiresAt: Math.floor(Date.now() / 1000) + 3600,
      };

      const client = createSpotifyClient(config, makeSaveConfig());
      await client.get("/v1/me/tracks");

      assert.equal(callCount, 1); // only API call, no refresh
      assert.equal(savedConfigs.length, 0);
    });
  });

  describe("error handling", () => {
    it("throws descriptive error on non-ok response", async () => {
      globalThis.fetch = async (_url: string | URL | Request, _init?: RequestInit) => {
        return new Response('{"error":{"message":"Invalid token"}}', {
          status: 401,
          statusText: "Unauthorized",
        });
      };

      const config: SpotifyConfig = {
        clientId: "test",
        accessToken: "bad-token",
        expiresAt: Math.floor(Date.now() / 1000) + 3600,
      };

      const client = createSpotifyClient(config, makeSaveConfig());

      await assert.rejects(
        () => client.get("/v1/me/tracks"),
        (err: Error) => {
          assert.ok(err.message.includes("401"));
          assert.ok(err.message.includes("Spotify API error"));
          assert.ok(err.message.includes("Invalid token"));
          return true;
        }
      );
    });
  });
});
