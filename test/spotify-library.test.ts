import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  fetchSpotifySavedTracks,
  fetchSpotifySavedAlbums,
  fetchSpotifyFollowedArtists,
  fetchSpotifyPlaylists,
  fetchSpotifyRecentlyPlayed,
  fetchSpotifyTopArtists,
  fetchSpotifyTopTracks,
  fetchSpotifyGenreBreakdown,
  fetchSpotifyLibrarySummary,
} from "../src/spotify/library.js";
import { spotifyCache } from "../src/spotify/cache.js";
import { type SpotifyClient } from "../src/spotify/spotify-client.js";

function mockClient(responses: Record<string, unknown>): SpotifyClient {
  return {
    get: async (path: string) => {
      for (const [pattern, response] of Object.entries(responses)) {
        if (path.includes(pattern)) return response;
      }
      throw new Error(`Unexpected path: ${path}`);
    },
    post: async () => ({}),
  } as unknown as SpotifyClient;
}

function makeTrack(id: string, name: string, artist: string, album: string): {
  id: string; name: string; artists: { name: string; id: string }[];
  album: { name: string }; duration_ms: number; uri: string;
} {
  return {
    id,
    name,
    artists: [{ name: artist, id: `artist-${id}` }],
    album: { name: album },
    duration_ms: 210000,
    uri: `spotify:track:${id}`,
  };
}

describe("fetchSpotifySavedTracks", () => {
  beforeEach(() => spotifyCache.clear());

  it("returns formatted track list", async () => {
    const client = mockClient({
      "/v1/me/tracks": {
        items: [
          { added_at: "2026-01-01", track: makeTrack("t1", "Song One", "Artist A", "Album X") },
          { added_at: "2026-01-02", track: makeTrack("t2", "Song Two", "Artist B", "Album Y") },
        ],
        total: 100,
        limit: 50,
        offset: 0,
        next: null,
      },
    });

    const result = await fetchSpotifySavedTracks(client, 50);
    assert.ok(result.includes("Spotify Saved Tracks (2 of 100)"));
    assert.ok(result.includes('"Song One" by Artist A'));
    assert.ok(result.includes("(Album X)"));
    assert.ok(result.includes("3:30"));
    assert.ok(result.includes("(ID: t1)"));
  });

  it("handles empty response", async () => {
    const client = mockClient({ "/v1/me/tracks": { items: [], total: 0, limit: 50, offset: 0, next: null } });
    const result = await fetchSpotifySavedTracks(client, 50);
    assert.ok(result.includes("No saved tracks found"));
  });
});

describe("fetchSpotifySavedAlbums", () => {
  beforeEach(() => spotifyCache.clear());

  it("returns formatted album list", async () => {
    const client = mockClient({
      "/v1/me/albums": {
        items: [{
          added_at: "2026-01-01",
          album: { id: "a1", name: "Great Album", artists: [{ name: "Artist A" }], total_tracks: 12, release_date: "2025-06-15", album_type: "album" },
        }],
        total: 50,
        limit: 50,
        offset: 0,
        next: null,
      },
    });

    const result = await fetchSpotifySavedAlbums(client, 50);
    assert.ok(result.includes("Spotify Saved Albums (1 of 50)"));
    assert.ok(result.includes('"Great Album" by Artist A'));
    assert.ok(result.includes("12 tracks"));
    assert.ok(result.includes("2025-06-15"));
  });

  it("handles empty response", async () => {
    const client = mockClient({ "/v1/me/albums": { items: [], total: 0, limit: 50, offset: 0, next: null } });
    const result = await fetchSpotifySavedAlbums(client, 50);
    assert.ok(result.includes("No saved albums found"));
  });

  it("handles single track grammar", async () => {
    const client = mockClient({
      "/v1/me/albums": {
        items: [{
          added_at: "2026-01-01",
          album: { id: "a1", name: "Single", artists: [{ name: "X" }], total_tracks: 1, release_date: "2025-01-01", album_type: "single" },
        }],
        total: 1, limit: 50, offset: 0, next: null,
      },
    });
    const result = await fetchSpotifySavedAlbums(client, 50);
    assert.ok(result.includes("1 track,"));
    assert.ok(!result.includes("1 tracks"));
  });
});

describe("fetchSpotifyFollowedArtists", () => {
  beforeEach(() => spotifyCache.clear());

  it("returns formatted artist list with genres", async () => {
    const client = mockClient({
      "/v1/me/following": {
        artists: {
          items: [
            { id: "ar1", name: "Cool Band", genres: ["indie rock", "alternative"], popularity: 75 },
            { id: "ar2", name: "Solo Artist", genres: [], popularity: 60 },
          ],
          total: 2,
          cursors: { after: null },
        },
      },
    });

    const result = await fetchSpotifyFollowedArtists(client, 50);
    assert.ok(result.includes("Spotify Followed Artists (2 of 2)"));
    assert.ok(result.includes("Cool Band [indie rock, alternative]"));
    assert.ok(result.includes("2. Solo Artist"));
    assert.ok(!result.includes("Solo Artist ["));
  });

  it("handles empty response", async () => {
    const client = mockClient({
      "/v1/me/following": { artists: { items: [], total: 0, cursors: { after: null } } },
    });
    const result = await fetchSpotifyFollowedArtists(client, 50);
    assert.ok(result.includes("No followed artists found"));
  });
});

describe("fetchSpotifyPlaylists", () => {
  beforeEach(() => spotifyCache.clear());

  it("returns formatted playlist list", async () => {
    const client = mockClient({
      "/v1/me/playlists": {
        items: [{
          id: "pl1", name: "My Playlist", description: "Chill vibes",
          tracks: { total: 42 }, owner: { display_name: "user" }, public: true,
        }],
        total: 5, limit: 50, offset: 0, next: null,
      },
    });

    const result = await fetchSpotifyPlaylists(client, 50);
    assert.ok(result.includes("Spotify Playlists (1 of 5)"));
    assert.ok(result.includes('"My Playlist"'));
    assert.ok(result.includes("42 tracks"));
    assert.ok(result.includes("ID: pl1"));
    assert.ok(result.includes("Chill vibes"));
  });

  it("handles empty response", async () => {
    const client = mockClient({ "/v1/me/playlists": { items: [], total: 0, limit: 50, offset: 0, next: null } });
    const result = await fetchSpotifyPlaylists(client, 50);
    assert.ok(result.includes("No playlists found"));
  });
});

describe("fetchSpotifyRecentlyPlayed", () => {
  beforeEach(() => spotifyCache.clear());

  it("returns formatted recently played list", async () => {
    const client = mockClient({
      "recently-played": {
        items: [{
          track: makeTrack("t1", "Recent Song", "Artist A", "Album Z"),
          played_at: "2026-03-26T12:00:00Z",
        }],
        next: null,
      },
    });

    const result = await fetchSpotifyRecentlyPlayed(client);
    assert.ok(result.includes("Spotify Recently Played"));
    assert.ok(result.includes('"Recent Song" by Artist A'));
    assert.ok(result.includes("played:"));
  });

  it("handles empty response", async () => {
    const client = mockClient({ "recently-played": { items: [], next: null } });
    const result = await fetchSpotifyRecentlyPlayed(client);
    assert.ok(result.includes("No recently played tracks found"));
  });
});

describe("fetchSpotifyTopArtists", () => {
  beforeEach(() => spotifyCache.clear());

  it("returns ranked artist list", async () => {
    const client = mockClient({
      "/v1/me/top/artists": {
        items: [
          { id: "ar1", name: "Top Artist", genres: ["pop", "dance"], popularity: 90 },
        ],
        total: 1, limit: 20, offset: 0,
      },
    });

    const result = await fetchSpotifyTopArtists(client, 20);
    assert.ok(result.includes("Spotify Top Artists"));
    assert.ok(result.includes("1. Top Artist [pop, dance]"));
  });

  it("handles empty response", async () => {
    const client = mockClient({ "/v1/me/top/artists": { items: [], total: 0, limit: 20, offset: 0 } });
    const result = await fetchSpotifyTopArtists(client, 20);
    assert.ok(result.includes("No top artists data available"));
  });
});

describe("fetchSpotifyTopTracks", () => {
  beforeEach(() => spotifyCache.clear());

  it("returns ranked track list", async () => {
    const client = mockClient({
      "/v1/me/top/tracks": {
        items: [makeTrack("t1", "Hit Song", "Pop Star", "Hit Album")],
        total: 1, limit: 20, offset: 0,
      },
    });

    const result = await fetchSpotifyTopTracks(client, 20);
    assert.ok(result.includes("Spotify Top Tracks"));
    assert.ok(result.includes('"Hit Song" by Pop Star (Hit Album)'));
  });

  it("handles empty response", async () => {
    const client = mockClient({ "/v1/me/top/tracks": { items: [], total: 0, limit: 20, offset: 0 } });
    const result = await fetchSpotifyTopTracks(client, 20);
    assert.ok(result.includes("No top tracks data available"));
  });
});

describe("fetchSpotifyGenreBreakdown", () => {
  beforeEach(() => spotifyCache.clear());

  it("returns genre frequency table", async () => {
    const client = mockClient({
      "/v1/me/tracks": {
        items: [
          { added_at: "2026-01-01", track: makeTrack("t1", "S1", "A1", "Al1") },
          { added_at: "2026-01-02", track: makeTrack("t2", "S2", "A2", "Al2") },
        ],
        total: 2, limit: 50, offset: 0, next: null,
      },
      "/v1/artists": {
        artists: [
          { id: "artist-t1", name: "A1", genres: ["rock", "indie"], popularity: 70 },
          { id: "artist-t2", name: "A2", genres: ["rock", "pop"], popularity: 60 },
        ],
      },
    });

    const result = await fetchSpotifyGenreBreakdown(client, 50);
    assert.ok(result.includes("Spotify Genre Breakdown"));
    assert.ok(result.includes("| rock |"));
    assert.ok(result.includes("| Genre | Artists | % |"));
  });

  it("handles empty tracks", async () => {
    const client = mockClient({
      "/v1/me/tracks": { items: [], total: 0, limit: 50, offset: 0, next: null },
    });
    const result = await fetchSpotifyGenreBreakdown(client, 50);
    assert.ok(result.includes("No saved tracks found"));
  });

  it("handles artists with no genres", async () => {
    const client = mockClient({
      "/v1/me/tracks": {
        items: [{ added_at: "2026-01-01", track: makeTrack("t1", "S1", "A1", "Al1") }],
        total: 1, limit: 50, offset: 0, next: null,
      },
      "/v1/artists": {
        artists: [{ id: "artist-t1", name: "A1", genres: [], popularity: 50 }],
      },
    });
    const result = await fetchSpotifyGenreBreakdown(client, 50);
    assert.ok(result.includes("No genre data available"));
  });
});

describe("fetchSpotifyLibrarySummary", () => {
  beforeEach(() => spotifyCache.clear());

  it("returns combined overview with counts and samples", async () => {
    const client = mockClient({
      "/v1/me/tracks": {
        items: [{ added_at: "2026-01-01", track: makeTrack("t1", "Song", "Artist", "Album") }],
        total: 500, limit: 10, offset: 0, next: null,
      },
      "/v1/me/albums": {
        items: [{
          added_at: "2026-01-01",
          album: { id: "a1", name: "Alb", artists: [{ name: "Art" }], total_tracks: 10, release_date: "2025", album_type: "album" },
        }],
        total: 50, limit: 10, offset: 0, next: null,
      },
      "/v1/me/playlists": {
        items: [{ id: "p1", name: "My List", description: null, tracks: { total: 20 }, owner: { display_name: "me" }, public: true }],
        total: 10, limit: 5, offset: 0, next: null,
      },
    });

    const result = await fetchSpotifyLibrarySummary(client);
    assert.ok(result.includes("Spotify Library Summary"));
    assert.ok(result.includes("**Saved Tracks:** 500"));
    assert.ok(result.includes("**Saved Albums:** 50"));
    assert.ok(result.includes("**Playlists:** 10"));
    assert.ok(result.includes("Sample Tracks"));
    assert.ok(result.includes("Sample Albums"));
    assert.ok(result.includes('"My List" (20 tracks)'));
  });

  it("handles API error gracefully", async () => {
    const client = {
      get: async () => { throw new Error("Network error"); },
      post: async () => ({}),
    } as unknown as SpotifyClient;

    const result = await fetchSpotifyLibrarySummary(client);
    assert.ok(result.includes("Error fetching library summary"));
    assert.ok(result.includes("Network error"));
  });
});
