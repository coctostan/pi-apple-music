import { describe, it } from "node:test";
import { beforeEach } from "node:test";
import { libraryCache } from "../src/cache.js";
import assert from "node:assert/strict";
import {
  fetchLibrarySongs,
  fetchLibraryArtists,
  fetchLibraryAlbums,
  fetchLibraryPlaylists,
  fetchRecentlyPlayed,
  fetchLibrarySummary,
  fetchGenreBreakdown,
  fetchTopArtists,
} from "../src/library.js";
import { type AppleMusicClient } from "../src/apple-music-client.js";

// Mock client that returns canned responses based on path
function createMockClient(responses: Record<string, unknown>): AppleMusicClient {
  return {
    get(path: string): Promise<unknown> {
      // Match on the path prefix (ignore query params for flexible matching)
      const basePath = path.split("?")[0] ?? path;
      for (const [key, value] of Object.entries(responses)) {
        if (basePath === key || path.startsWith(key)) {
          return Promise.resolve(value);
        }
      }
      return Promise.reject(new Error(`No mock for path: ${path}`));
    },
    post(_path: string, _body: unknown): Promise<unknown> {
      return Promise.reject(new Error("POST not mocked"));
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

const mockSongsResponse = {
  data: [
    {
      id: "s1",
      type: "library-songs",
      attributes: {
        name: "Bohemian Rhapsody",
        artistName: "Queen",
        albumName: "A Night at the Opera",
        genreNames: ["Rock"],
        durationInMillis: 354000,
        trackNumber: 11,
      },
    },
    {
      id: "s2",
      type: "library-songs",
      attributes: {
        name: "Stairway to Heaven",
        artistName: "Led Zeppelin",
        albumName: "Led Zeppelin IV",
        genreNames: ["Rock", "Classic Rock"],
        durationInMillis: 482000,
        trackNumber: 4,
      },
    },
  ],
  meta: { total: 150 },
};

const mockArtistsResponse = {
  data: [
    { id: "a1", type: "library-artists", attributes: { name: "Queen" } },
    { id: "a2", type: "library-artists", attributes: { name: "Led Zeppelin" } },
    { id: "a3", type: "library-artists", attributes: { name: "Pink Floyd" } },
  ],
  meta: { total: 42 },
};

const mockAlbumsResponse = {
  data: [
    {
      id: "al1",
      type: "library-albums",
      attributes: {
        name: "A Night at the Opera",
        artistName: "Queen",
        trackCount: 12,
        genreNames: ["Rock"],
        releaseDate: "1975-11-21",
      },
    },
    {
      id: "al2",
      type: "library-albums",
      attributes: {
        name: "The Dark Side of the Moon",
        artistName: "Pink Floyd",
        trackCount: 10,
        genreNames: ["Progressive Rock"],
      },
    },
  ],
  meta: { total: 30 },
};

const mockPlaylistsResponse = {
  data: [
    {
      id: "p1",
      type: "library-playlists",
      attributes: {
        name: "Road Trip Mix",
        dateAdded: "2025-06-15",
        description: { standard: "Songs for long drives" },
      },
    },
    {
      id: "p2",
      type: "library-playlists",
      attributes: {
        name: "Workout Beats",
        dateAdded: "2025-08-01",
      },
    },
  ],
  meta: { total: 8 },
};

const mockRecentResponse = {
  data: [
    {
      id: "r1",
      type: "albums",
      attributes: { name: "Rumours", artistName: "Fleetwood Mac" },
    },
    {
      id: "r2",
      type: "library-playlists",
      attributes: { name: "Chill Vibes" },
    },
    {
      id: "r3",
      type: "stations",
      attributes: { name: "Classic Rock Radio" },
    },
  ],
};

void describe("fetchLibrarySongs", () => {
  beforeEach(() => libraryCache.clear());
  void it("formats songs with name, artist, album, duration, and genre", async () => {
    const client = createMockClient({ "/v1/me/library/songs": mockSongsResponse });
    const result = await fetchLibrarySongs(client, 50);

    assert.ok(result.includes("## Library Songs (2 of 150)"));
    assert.ok(result.includes('"Bohemian Rhapsody" by Queen (A Night at the Opera)'));
    assert.ok(result.includes("[Rock]"));
    assert.ok(result.includes("5:54")); // 354000ms = 5:54
    assert.ok(result.includes('"Stairway to Heaven" by Led Zeppelin'));
    assert.ok(result.includes("[Rock, Classic Rock]"));
    assert.ok(result.includes("(ID: s1)"), "Should include track ID");
    assert.ok(result.includes("(ID: s2)"), "Should include track ID");
  });

  void it("handles empty response", async () => {
    const client = createMockClient({ "/v1/me/library/songs": { data: [] } });
    const result = await fetchLibrarySongs(client, 50);
    assert.ok(result.includes("No songs found in library"));
  });

  void it("handles API error gracefully", async () => {
    const client = createErrorClient("401 Unauthorized");
    const result = await fetchLibrarySongs(client, 50);
    assert.ok(result.includes("Error fetching songs"));
    assert.ok(result.includes("401 Unauthorized"));
  });
});

void describe("fetchLibraryArtists", () => {
  beforeEach(() => libraryCache.clear());
  void it("formats artists as a numbered list", async () => {
    const client = createMockClient({ "/v1/me/library/artists": mockArtistsResponse });
    const result = await fetchLibraryArtists(client, 50);

    assert.ok(result.includes("## Library Artists (3 of 42)"));
    assert.ok(result.includes("1. Queen"));
    assert.ok(result.includes("2. Led Zeppelin"));
    assert.ok(result.includes("3. Pink Floyd"));
  });

  void it("handles empty response", async () => {
    const client = createMockClient({ "/v1/me/library/artists": { data: [] } });
    const result = await fetchLibraryArtists(client, 50);
    assert.ok(result.includes("No artists found in library"));
  });
});

void describe("fetchLibraryAlbums", () => {
  beforeEach(() => libraryCache.clear());
  void it("formats albums with name, artist, track count, and genre", async () => {
    const client = createMockClient({ "/v1/me/library/albums": mockAlbumsResponse });
    const result = await fetchLibraryAlbums(client, 50);

    assert.ok(result.includes("## Library Albums (2 of 30)"));
    assert.ok(result.includes('"A Night at the Opera" by Queen (12 tracks)'));
    assert.ok(result.includes("[Rock]"));
    assert.ok(result.includes('"The Dark Side of the Moon" by Pink Floyd (10 tracks)'));
    assert.ok(result.includes("[Progressive Rock]"));
  });

  void it("handles single track correctly", async () => {
    const client = createMockClient({
      "/v1/me/library/albums": {
        data: [
          {
            id: "al3",
            type: "library-albums",
            attributes: {
              name: "Single",
              artistName: "Artist",
              trackCount: 1,
              genreNames: [],
            },
          },
        ],
        meta: { total: 1 },
      },
    });
    const result = await fetchLibraryAlbums(client, 50);
    assert.ok(result.includes("(1 track)"), "Single track should not be pluralized");
  });
});

void describe("fetchLibraryPlaylists", () => {
  beforeEach(() => libraryCache.clear());
  void it("formats playlists with name and description", async () => {
    const client = createMockClient({
      "/v1/me/library/playlists": mockPlaylistsResponse,
    });
    const result = await fetchLibraryPlaylists(client, 50);

    assert.ok(result.includes("## Library Playlists (2 of 8)"));
    assert.ok(result.includes('"Road Trip Mix" (ID: p1) — Songs for long drives'));
    assert.ok(result.includes('"Workout Beats"'));
  });

  void it("handles empty response", async () => {
    const client = createMockClient({ "/v1/me/library/playlists": { data: [] } });
    const result = await fetchLibraryPlaylists(client, 50);
    assert.ok(result.includes("No playlists found in library"));
  });
});

void describe("fetchRecentlyPlayed", () => {
  beforeEach(() => libraryCache.clear());
  void it("formats recently played items with type", async () => {
    const client = createMockClient({ "/v1/me/recent/played": mockRecentResponse });
    const result = await fetchRecentlyPlayed(client);

    assert.ok(result.includes("## Recently Played"));
    assert.ok(result.includes('"Rumours" by Fleetwood Mac (album)'));
    assert.ok(result.includes('"Chill Vibes" (playlist)'));
    assert.ok(result.includes('"Classic Rock Radio" (station)'));
  });

  void it("handles empty response", async () => {
    const client = createMockClient({ "/v1/me/recent/played": { data: [] } });
    const result = await fetchRecentlyPlayed(client);
    assert.ok(result.includes("No recently played items found"));
  });
});

void describe("fetchLibrarySummary", () => {
  beforeEach(() => libraryCache.clear());
  void it("returns combined overview with counts and samples", async () => {
    const client = createMockClient({
      "/v1/me/library/songs": mockSongsResponse,
      "/v1/me/library/artists": mockArtistsResponse,
      "/v1/me/library/albums": mockAlbumsResponse,
      "/v1/me/library/playlists": mockPlaylistsResponse,
    });
    const result = await fetchLibrarySummary(client);

    assert.ok(result.includes("## Library Summary"));
    assert.ok(result.includes("**Songs:** 150"));
    assert.ok(result.includes("**Artists:** 42"));
    assert.ok(result.includes("**Albums:** 30"));
    assert.ok(result.includes("**Playlists:** 8"));
    assert.ok(result.includes("### Sample Songs"));
    assert.ok(result.includes("### Sample Artists"));
    assert.ok(result.includes("### Sample Albums"));
    assert.ok(result.includes("### Playlists"));
  });

  void it("handles API error gracefully", async () => {
    const client = createErrorClient("Network error");
    const result = await fetchLibrarySummary(client);
    assert.ok(result.includes("Error fetching library summary"));
    assert.ok(result.includes("Network error"));
  });
});

void describe("fetchGenreBreakdown", () => {
  beforeEach(() => libraryCache.clear());

  void it("returns genre table sorted by frequency", async () => {
    const client = createMockClient({ "/v1/me/library/songs": mockSongsResponse });
    const result = await fetchGenreBreakdown(client, 100);

    assert.ok(result.includes("## Genre Breakdown (2 songs analyzed)"));
    assert.ok(result.includes("| Genre | Songs | % |"));
    assert.ok(result.includes("| Rock | 2 | 100% |"));
    assert.ok(result.includes("| Classic Rock | 1 | 50% |"));
  });

  void it("handles empty library", async () => {
    const client = createMockClient({ "/v1/me/library/songs": { data: [] } });
    const result = await fetchGenreBreakdown(client, 100);
    assert.ok(result.includes("No songs found in library"));
  });
});

void describe("fetchTopArtists", () => {
  beforeEach(() => libraryCache.clear());

  void it("returns artists sorted by song count", async () => {
    const client = createMockClient({ "/v1/me/library/songs": mockSongsResponse });
    const result = await fetchTopArtists(client, 10);

    assert.ok(result.includes("## Top Artists"));
    // Both artists have 1 song each, order may vary
    assert.ok(result.includes("Queen (1 song)"));
    assert.ok(result.includes("Led Zeppelin (1 song)"));
  });

  void it("handles empty library", async () => {
    const client = createMockClient({ "/v1/me/library/songs": { data: [] } });
    const result = await fetchTopArtists(client, 10);
    assert.ok(result.includes("No songs found in library"));
  });
});
