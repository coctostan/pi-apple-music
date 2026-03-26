import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { searchCatalog, createPlaylist, addTracksToPlaylist } from "../src/playlist.js";
import { type AppleMusicClient } from "../src/apple-music-client.js";

function createMockClient(responses: Record<string, unknown>): AppleMusicClient {
  return {
    get(path: string): Promise<unknown> {
      const basePath = path.split("?")[0] ?? path;
      for (const [key, value] of Object.entries(responses)) {
        if (basePath === key || path.startsWith(key)) {
          return Promise.resolve(value);
        }
      }
      return Promise.reject(new Error(`No mock for path: ${path}`));
    },
    post(path: string, _body: unknown): Promise<unknown> {
      for (const [key, value] of Object.entries(responses)) {
        if (path === key || path.startsWith(key)) {
          return Promise.resolve(value);
        }
      }
      return Promise.reject(new Error(`No mock for path: ${path}`));
    },
  } as unknown as AppleMusicClient;
}

function createErrorClient(message: string): AppleMusicClient {
  return {
    get(): Promise<unknown> {
      return Promise.reject(new Error(message));
    },
    post(): Promise<unknown> {
      return Promise.reject(new Error(message));
    },
  } as unknown as AppleMusicClient;
}

const mockSearchResponse = {
  results: {
    songs: {
      data: [
        {
          id: "1482041830",
          type: "songs",
          attributes: {
            name: "Cloud 9",
            artistName: "Beach Bunny",
            albumName: "Honeymoon",
            genreNames: ["Alternative"],
            durationInMillis: 147351,
          },
        },
        {
          id: "1613600190",
          type: "songs",
          attributes: {
            name: "Oxygen",
            artistName: "Beach Bunny",
            albumName: "Emotional Creature",
            genreNames: ["Indie Rock"],
            durationInMillis: 194000,
          },
        },
      ],
    },
  },
};

const mockCreatePlaylistResponse = {
  data: [
    {
      id: "p.RB1AAkGsv74Zkl",
      type: "library-playlists",
      href: "/v1/me/library/playlists/p.RB1AAkGsv74Zkl",
      attributes: {
        name: "My New Playlist",
        canEdit: true,
        dateAdded: "2026-03-26T10:00:00Z",
      },
    },
  ],
};

void describe("searchCatalog", () => {
  void it("returns formatted results with song name, artist, album, and ID", async () => {
    const client = createMockClient({
      "/v1/catalog/us/search": mockSearchResponse,
    });
    const result = await searchCatalog(client, "Beach Bunny", 25);

    assert.ok(result.includes('## Search Results for "Beach Bunny" (2 found)'));
    assert.ok(result.includes('"Cloud 9" by Beach Bunny (Honeymoon) — ID: 1482041830'));
    assert.ok(result.includes('"Oxygen" by Beach Bunny (Emotional Creature) — ID: 1613600190'));
    assert.ok(result.includes("Use the ID values below"));
  });

  void it("handles empty results", async () => {
    const client = createMockClient({
      "/v1/catalog/us/search": { results: { songs: { data: [] } } },
    });
    const result = await searchCatalog(client, "xyznonexistent", 25);
    assert.ok(result.includes('No songs found matching "xyznonexistent"'));
  });

  void it("handles missing songs in response", async () => {
    const client = createMockClient({
      "/v1/catalog/us/search": { results: {} },
    });
    const result = await searchCatalog(client, "test", 25);
    assert.ok(result.includes('No songs found matching "test"'));
  });

  void it("handles API errors gracefully", async () => {
    const client = createErrorClient("401 Unauthorized");
    const result = await searchCatalog(client, "test", 25);
    assert.ok(result.includes("Error searching catalog"));
    assert.ok(result.includes("401 Unauthorized"));
  });

  void it("uses custom storefront", async () => {
    let capturedPath = "";
    const client = {
      get(path: string): Promise<unknown> {
        capturedPath = path;
        return Promise.resolve({ results: { songs: { data: [] } } });
      },
      post(): Promise<unknown> {
        return Promise.reject(new Error("not used"));
      },
    } as unknown as AppleMusicClient;

    await searchCatalog(client, "test", 10, "gb");
    assert.ok(capturedPath.includes("/v1/catalog/gb/search"), "Should use gb storefront");
  });
});

void describe("createPlaylist", () => {
  void it("returns confirmation with playlist name and track count", async () => {
    const client = createMockClient({
      "/v1/me/library/playlists": mockCreatePlaylistResponse,
    });
    const result = await createPlaylist(client, "My New Playlist", "A great mix", [
      "1482041830",
      "1613600190",
    ]);

    assert.ok(result.includes("## Playlist Created ✓"));
    assert.ok(result.includes("**Name:** My New Playlist"));
    assert.ok(result.includes("**Description:** A great mix"));
    assert.ok(result.includes("**Tracks added:** 2"));
    assert.ok(result.includes('playlist "My New Playlist" has been created'));
  });

  void it("notes duplicate tracks when libraryTrackIds provided", async () => {
    const client = createMockClient({
      "/v1/me/library/playlists": mockCreatePlaylistResponse,
    });
    const libraryIds = new Set(["1482041830", "9999999"]);
    const result = await createPlaylist(
      client,
      "Dupes Test",
      undefined,
      ["1482041830", "1613600190"],
      libraryIds
    );

    assert.ok(result.includes("1 track(s) may already be in your library"));
  });

  void it("does not note duplicates when none found", async () => {
    const client = createMockClient({
      "/v1/me/library/playlists": mockCreatePlaylistResponse,
    });
    const libraryIds = new Set(["9999999"]);
    const result = await createPlaylist(client, "No Dupes", undefined, ["1482041830"], libraryIds);

    assert.ok(!result.includes("may already be in your library"));
  });

  void it("works without libraryTrackIds (backwards compatible)", async () => {
    const client = createMockClient({
      "/v1/me/library/playlists": mockCreatePlaylistResponse,
    });
    const result = await createPlaylist(client, "No Dedup", undefined, ["1482041830"]);

    assert.ok(result.includes("Playlist Created"));
    assert.ok(!result.includes("may already be in your library"));
  });

  void it("handles undefined description", async () => {
    const client = createMockClient({
      "/v1/me/library/playlists": mockCreatePlaylistResponse,
    });
    const result = await createPlaylist(client, "My Playlist", undefined, ["1482041830"]);

    assert.ok(result.includes("**Description:** None"));
  });

  void it("handles empty track list", async () => {
    const client = createMockClient({
      "/v1/me/library/playlists": mockCreatePlaylistResponse,
    });
    const result = await createPlaylist(client, "Empty Playlist", undefined, []);

    assert.ok(result.includes("**Tracks added:** 0"));
  });

  void it("handles API errors gracefully", async () => {
    const client = createErrorClient("403 Forbidden");
    const result = await createPlaylist(client, "Test", undefined, ["123"]);

    assert.ok(result.includes("Playlist Creation Failed"));
    assert.ok(result.includes("403 Forbidden"));
  });

  void it("detects library IDs vs catalog IDs correctly", async () => {
    let capturedBody: unknown = null;
    const client = {
      get(): Promise<unknown> {
        return Promise.reject(new Error("not used"));
      },
      post(_path: string, body: unknown): Promise<unknown> {
        capturedBody = body;
        return Promise.resolve(mockCreatePlaylistResponse);
      },
    } as unknown as AppleMusicClient;

    await createPlaylist(client, "Mixed Playlist", undefined, [
      "1482041830",
      "i.abcdef123",
      "9876543210",
    ]);

    const parsed = capturedBody as {
      relationships?: { tracks: { data: { id: string; type: string }[] } };
    };
    const tracks = parsed.relationships?.tracks.data;
    assert.ok(tracks, "Should have tracks relationship");
    assert.equal(tracks.length, 3);
    assert.equal(tracks[0]?.type, "songs", "Numeric ID should be type songs");
    assert.equal(tracks[1]?.type, "library-songs", "i. prefix should be type library-songs");
    assert.equal(tracks[2]?.type, "songs", "Numeric ID should be type songs");
  });
});

void describe("addTracksToPlaylist", () => {
  void it("returns confirmation with playlist ID and track count", async () => {
    const client = createMockClient({
      "/v1/me/library/playlists/p.ABC123/tracks": null, // 204 No Content
    });
    const result = await addTracksToPlaylist(client, "p.ABC123", ["1482041830", "1613600190"]);

    assert.ok(result.includes("## Tracks Added \u2713"));
    assert.ok(result.includes("**Playlist ID:** p.ABC123"));
    assert.ok(result.includes("**Tracks added:** 2"));
    assert.ok(result.includes("Successfully added 2 tracks"));
  });

  void it("handles single track grammar", async () => {
    const client = createMockClient({
      "/v1/me/library/playlists/p.XYZ/tracks": null,
    });
    const result = await addTracksToPlaylist(client, "p.XYZ", ["123"]);
    assert.ok(result.includes("1 track to"), "Single track should not be pluralized");
  });

  void it("handles API errors gracefully", async () => {
    const client = createErrorClient("403 Forbidden");
    const result = await addTracksToPlaylist(client, "p.ABC123", ["123"]);
    assert.ok(result.includes("Add Tracks Failed"));
    assert.ok(result.includes("403 Forbidden"));
  });

  void it("correctly builds request body with track types", async () => {
    let capturedBody: unknown = null;
    const client = {
      get(): Promise<unknown> {
        return Promise.reject(new Error("not used"));
      },
      post(_path: string, body: unknown): Promise<unknown> {
        capturedBody = body;
        return Promise.resolve(null); // 204
      },
    } as unknown as AppleMusicClient;

    await addTracksToPlaylist(client, "p.TEST", ["1234", "i.lib5678"]);

    const parsed = capturedBody as { data: { id: string; type: string }[] };
    assert.equal(parsed.data.length, 2);
    assert.equal(parsed.data[0]?.type, "songs");
    assert.equal(parsed.data[1]?.type, "library-songs");
  });
});
