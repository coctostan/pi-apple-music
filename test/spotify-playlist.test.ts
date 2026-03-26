import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  searchSpotifyCatalog,
  createSpotifyPlaylist,
  addTracksToSpotifyPlaylist,
} from "../src/spotify/playlist.js";
import { spotifyCache } from "../src/spotify/cache.js";
import { type SpotifyClient } from "../src/spotify/spotify-client.js";

function mockClient(handlers: {
  get?: (path: string) => Promise<unknown>;
  post?: (path: string, body: unknown) => Promise<unknown>;
}): SpotifyClient {
  return {
    get: handlers.get ?? (async () => ({})),
    post: handlers.post ?? (async () => ({})),
  } as unknown as SpotifyClient;
}

describe("searchSpotifyCatalog", () => {
  beforeEach(() => spotifyCache.clear());

  it("returns formatted results with name, artist, album, and URI", async () => {
    const client = mockClient({
      get: async () => ({
        tracks: {
          items: [
            {
              id: "t1",
              name: "Bohemian Rhapsody",
              artists: [{ name: "Queen", id: "a1" }],
              album: { name: "A Night at the Opera" },
              duration_ms: 354000,
              uri: "spotify:track:t1",
            },
          ],
          total: 1,
          limit: 10,
          offset: 0,
          next: null,
        },
      }),
    });

    const result = await searchSpotifyCatalog(client, "bohemian rhapsody", 10);
    assert.ok(result.includes('Spotify Search Results for "bohemian rhapsody"'));
    assert.ok(result.includes('"Bohemian Rhapsody" by Queen'));
    assert.ok(result.includes("A Night at the Opera"));
    assert.ok(result.includes("URI: spotify:track:t1"));
    assert.ok(result.includes("Use the URI values"));
  });

  it("handles empty results", async () => {
    const client = mockClient({
      get: async () => ({ tracks: { items: [], total: 0, limit: 10, offset: 0, next: null } }),
    });

    const result = await searchSpotifyCatalog(client, "nonexistent", 10);
    assert.ok(result.includes("No tracks found"));
  });

  it("handles API error gracefully", async () => {
    const client = mockClient({
      get: async () => { throw new Error("Rate limited"); },
    });

    const result = await searchSpotifyCatalog(client, "test", 10);
    assert.ok(result.includes("Error searching catalog"));
    assert.ok(result.includes("Rate limited"));
  });

  it("caps limit at 10 per Spotify Feb 2026 change", async () => {
    let capturedPath = "";
    const client = mockClient({
      get: async (path: string) => {
        capturedPath = path;
        return { tracks: { items: [], total: 0, limit: 10, offset: 0, next: null } };
      },
    });

    await searchSpotifyCatalog(client, "test", 50);
    assert.ok(capturedPath.includes("limit=10"), `Expected limit=10 but got: ${capturedPath}`);
  });
});

describe("createSpotifyPlaylist", () => {
  beforeEach(() => spotifyCache.clear());

  it("creates playlist and adds tracks", async () => {
    const calls: { path: string; body: unknown }[] = [];
    const client = mockClient({
      post: async (path: string, body: unknown) => {
        calls.push({ path, body });
        if (path.includes("/v1/me/playlists")) {
          return {
            id: "pl-new",
            name: "My Playlist",
            external_urls: { spotify: "https://open.spotify.com/playlist/pl-new" },
            tracks: { total: 0 },
          };
        }
        return { snapshot_id: "snap1" };
      },
    });

    const result = await createSpotifyPlaylist(
      client, "My Playlist", "Cool tunes", ["spotify:track:t1", "spotify:track:t2"]
    );

    assert.ok(result.includes("Spotify Playlist Created ✓"));
    assert.ok(result.includes("**Name:** My Playlist"));
    assert.ok(result.includes("**Tracks added:** 2"));
    assert.ok(result.includes("https://open.spotify.com/playlist/pl-new"));
    assert.equal(calls.length, 2);
    assert.ok(calls[0]!.path.includes("/v1/me/playlists"));
    assert.ok(calls[1]!.path.includes("/v1/playlists/pl-new/tracks"));
  });

  it("reports duplicate count when existingTrackUris provided", async () => {
    const client = mockClient({
      post: async (path: string) => {
        if (path.includes("/v1/me/playlists")) {
          return {
            id: "pl1", name: "Test", external_urls: { spotify: "https://spotify.com/pl1" },
            tracks: { total: 0 },
          };
        }
        return {};
      },
    });

    const existing = new Set(["spotify:track:t1", "spotify:track:t3"]);
    const result = await createSpotifyPlaylist(
      client, "Test", undefined, ["spotify:track:t1", "spotify:track:t2"], existing
    );

    assert.ok(result.includes("1 track(s) may already be in your library"));
  });

  it("works without description", async () => {
    const client = mockClient({
      post: async (path: string) => {
        if (path.includes("/v1/me/playlists")) {
          return {
            id: "pl1", name: "No Desc", external_urls: { spotify: "https://spotify.com/pl1" },
            tracks: { total: 0 },
          };
        }
        return {};
      },
    });

    const result = await createSpotifyPlaylist(client, "No Desc", undefined, []);
    assert.ok(result.includes("**Description:** None"));
  });

  it("handles empty track list", async () => {
    const calls: string[] = [];
    const client = mockClient({
      post: async (path: string) => {
        calls.push(path);
        if (path.includes("/v1/me/playlists")) {
          return {
            id: "pl1", name: "Empty", external_urls: { spotify: "https://spotify.com/pl1" },
            tracks: { total: 0 },
          };
        }
        return {};
      },
    });

    const result = await createSpotifyPlaylist(client, "Empty", undefined, []);
    assert.ok(result.includes("**Tracks added:** 0"));
    assert.equal(calls.length, 1); // only create, no add-tracks call
  });

  it("handles API error gracefully", async () => {
    const client = mockClient({
      post: async () => { throw new Error("Forbidden"); },
    });

    const result = await createSpotifyPlaylist(client, "Test", undefined, []);
    assert.ok(result.includes("Spotify Playlist Creation Failed"));
    assert.ok(result.includes("Forbidden"));
  });
});

describe("addTracksToSpotifyPlaylist", () => {
  beforeEach(() => spotifyCache.clear());

  it("adds tracks and returns confirmation", async () => {
    const client = mockClient({
      post: async () => ({ snapshot_id: "snap1" }),
    });

    const result = await addTracksToSpotifyPlaylist(
      client, "pl-123", ["spotify:track:t1", "spotify:track:t2"]
    );

    assert.ok(result.includes("Spotify Tracks Added ✓"));
    assert.ok(result.includes("**Playlist ID:** pl-123"));
    assert.ok(result.includes("**Tracks added:** 2"));
    assert.ok(result.includes("2 tracks"));
  });

  it("handles single track grammar", async () => {
    const client = mockClient({
      post: async () => ({ snapshot_id: "snap1" }),
    });

    const result = await addTracksToSpotifyPlaylist(client, "pl-1", ["spotify:track:t1"]);
    assert.ok(result.includes("1 track to"));
    assert.ok(!result.includes("1 tracks"));
  });

  it("handles API error gracefully", async () => {
    const client = mockClient({
      post: async () => { throw new Error("Not found"); },
    });

    const result = await addTracksToSpotifyPlaylist(client, "bad-id", ["spotify:track:t1"]);
    assert.ok(result.includes("Spotify Add Tracks Failed"));
    assert.ok(result.includes("Not found"));
  });
});
