import { type SpotifyClient } from "./spotify-client.js";
import {
  type SpotifyPaginated,
  type SpotifySavedTrack,
  type SpotifySavedAlbum,
  type SpotifyFollowedArtists,
  type SpotifyPlaylist,
  type SpotifyRecentlyPlayed,
  type SpotifyArtist,
  type SpotifyTrack,
  type SpotifyTopItems,
} from "./types.js";
import { spotifyCache } from "./cache.js";

function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export async function fetchSpotifySavedTracks(
  client: SpotifyClient,
  limit: number = 50
): Promise<string> {
  const cacheKey = `spotify:tracks:${limit}`;
  const cached = spotifyCache.get(cacheKey);
  if (cached) return cached;

  try {
    const response = (await client.get(
      `/v1/me/tracks?limit=${limit}`
    )) as SpotifyPaginated<SpotifySavedTrack>;

    if (!response.items || response.items.length === 0) {
      return "## Spotify Saved Tracks\nNo saved tracks found.";
    }

    const lines = response.items.map((item, i) => {
      const t = item.track;
      const artists = t.artists.map((a) => a.name).join(", ");
      const duration = formatDuration(t.duration_ms);
      return `${i + 1}. "${t.name}" by ${artists} (${t.album.name}) ${duration} (ID: ${t.id})`;
    });

    const result = `## Spotify Saved Tracks (${response.items.length} of ${response.total})\n\n${lines.join("\n")}`;
    spotifyCache.set(cacheKey, result);
    return result;
  } catch (error) {
    return `## Spotify Saved Tracks\nError fetching tracks: ${error instanceof Error ? error.message : String(error)}`;
  }
}

export async function fetchSpotifySavedAlbums(
  client: SpotifyClient,
  limit: number = 50
): Promise<string> {
  const cacheKey = `spotify:albums:${limit}`;
  const cached = spotifyCache.get(cacheKey);
  if (cached) return cached;

  try {
    const response = (await client.get(
      `/v1/me/albums?limit=${limit}`
    )) as SpotifyPaginated<SpotifySavedAlbum>;

    if (!response.items || response.items.length === 0) {
      return "## Spotify Saved Albums\nNo saved albums found.";
    }

    const lines = response.items.map((item, i) => {
      const a = item.album;
      const artists = a.artists.map((ar) => ar.name).join(", ");
      const tracks = `${a.total_tracks} track${a.total_tracks !== 1 ? "s" : ""}`;
      return `${i + 1}. "${a.name}" by ${artists} (${tracks}, ${a.release_date})`;
    });

    const result = `## Spotify Saved Albums (${response.items.length} of ${response.total})\n\n${lines.join("\n")}`;
    spotifyCache.set(cacheKey, result);
    return result;
  } catch (error) {
    return `## Spotify Saved Albums\nError fetching albums: ${error instanceof Error ? error.message : String(error)}`;
  }
}

export async function fetchSpotifyFollowedArtists(
  client: SpotifyClient,
  limit: number = 50
): Promise<string> {
  const cacheKey = `spotify:followed-artists:${limit}`;
  const cached = spotifyCache.get(cacheKey);
  if (cached) return cached;

  try {
    const response = (await client.get(
      `/v1/me/following?type=artist&limit=${limit}`
    )) as SpotifyFollowedArtists;

    const items = response.artists?.items;
    if (!items || items.length === 0) {
      return "## Spotify Followed Artists\nNo followed artists found.";
    }

    const lines = items.map((artist, i) => {
      const genres = artist.genres.length > 0 ? ` [${artist.genres.join(", ")}]` : "";
      return `${i + 1}. ${artist.name}${genres}`;
    });

    const result = `## Spotify Followed Artists (${items.length} of ${response.artists.total})\n\n${lines.join("\n")}`;
    spotifyCache.set(cacheKey, result);
    return result;
  } catch (error) {
    return `## Spotify Followed Artists\nError fetching artists: ${error instanceof Error ? error.message : String(error)}`;
  }
}

export async function fetchSpotifyPlaylists(
  client: SpotifyClient,
  limit: number = 50
): Promise<string> {
  const cacheKey = `spotify:playlists:${limit}`;
  const cached = spotifyCache.get(cacheKey);
  if (cached) return cached;

  try {
    const response = (await client.get(
      `/v1/me/playlists?limit=${limit}`
    )) as SpotifyPaginated<SpotifyPlaylist>;

    if (!response.items || response.items.length === 0) {
      return "## Spotify Playlists\nNo playlists found.";
    }

    const lines = response.items.map((p, i) => {
      const tracks = `${p.tracks.total} track${p.tracks.total !== 1 ? "s" : ""}`;
      const desc = p.description ? ` — ${p.description}` : "";
      return `${i + 1}. "${p.name}" (${tracks}, ID: ${p.id})${desc}`;
    });

    const result = `## Spotify Playlists (${response.items.length} of ${response.total})\n\n${lines.join("\n")}`;
    spotifyCache.set(cacheKey, result);
    return result;
  } catch (error) {
    return `## Spotify Playlists\nError fetching playlists: ${error instanceof Error ? error.message : String(error)}`;
  }
}

export async function fetchSpotifyRecentlyPlayed(client: SpotifyClient): Promise<string> {
  const cacheKey = "spotify:recent:20";
  const cached = spotifyCache.get(cacheKey);
  if (cached) return cached;

  try {
    const response = (await client.get(
      `/v1/me/player/recently-played?limit=20`
    )) as SpotifyRecentlyPlayed;

    if (!response.items || response.items.length === 0) {
      return "## Spotify Recently Played\nNo recently played tracks found.";
    }

    const lines = response.items.map((item, i) => {
      const t = item.track;
      const artists = t.artists.map((a) => a.name).join(", ");
      const playedAt = new Date(item.played_at).toLocaleString();
      return `${i + 1}. "${t.name}" by ${artists} (played: ${playedAt})`;
    });

    const result = `## Spotify Recently Played\n\n${lines.join("\n")}`;
    spotifyCache.set(cacheKey, result);
    return result;
  } catch (error) {
    return `## Spotify Recently Played\nError fetching recently played: ${error instanceof Error ? error.message : String(error)}`;
  }
}

export async function fetchSpotifyTopArtists(
  client: SpotifyClient,
  limit: number = 20
): Promise<string> {
  const cacheKey = `spotify:top-artists:${limit}`;
  const cached = spotifyCache.get(cacheKey);
  if (cached) return cached;

  try {
    const response = (await client.get(
      `/v1/me/top/artists?limit=${limit}&time_range=medium_term`
    )) as SpotifyTopItems<SpotifyArtist>;

    if (!response.items || response.items.length === 0) {
      return "## Spotify Top Artists\nNo top artists data available.";
    }

    const lines = response.items.map((artist, i) => {
      const genres = artist.genres.length > 0 ? ` [${artist.genres.join(", ")}]` : "";
      return `${i + 1}. ${artist.name}${genres}`;
    });

    const result = `## Spotify Top Artists\n\n${lines.join("\n")}`;
    spotifyCache.set(cacheKey, result);
    return result;
  } catch (error) {
    return `## Spotify Top Artists\nError fetching top artists: ${error instanceof Error ? error.message : String(error)}`;
  }
}

export async function fetchSpotifyTopTracks(
  client: SpotifyClient,
  limit: number = 20
): Promise<string> {
  const cacheKey = `spotify:top-tracks:${limit}`;
  const cached = spotifyCache.get(cacheKey);
  if (cached) return cached;

  try {
    const response = (await client.get(
      `/v1/me/top/tracks?limit=${limit}&time_range=medium_term`
    )) as SpotifyTopItems<SpotifyTrack>;

    if (!response.items || response.items.length === 0) {
      return "## Spotify Top Tracks\nNo top tracks data available.";
    }

    const lines = response.items.map((t, i) => {
      const artists = t.artists.map((a) => a.name).join(", ");
      return `${i + 1}. "${t.name}" by ${artists} (${t.album.name})`;
    });

    const result = `## Spotify Top Tracks\n\n${lines.join("\n")}`;
    spotifyCache.set(cacheKey, result);
    return result;
  } catch (error) {
    return `## Spotify Top Tracks\nError fetching top tracks: ${error instanceof Error ? error.message : String(error)}`;
  }
}

export async function fetchSpotifyGenreBreakdown(
  client: SpotifyClient,
  limit: number = 50
): Promise<string> {
  const cacheKey = `spotify:genres:${limit}`;
  const cached = spotifyCache.get(cacheKey);
  if (cached) return cached;

  try {
    const tracksRes = (await client.get(
      `/v1/me/tracks?limit=${limit}`
    )) as SpotifyPaginated<SpotifySavedTrack>;

    if (!tracksRes.items || tracksRes.items.length === 0) {
      return "## Spotify Genre Breakdown\nNo saved tracks found.";
    }

    // Collect unique artist IDs
    const artistIds = new Set<string>();
    for (const item of tracksRes.items) {
      for (const artist of item.track.artists) {
        artistIds.add(artist.id);
      }
    }

    // Batch fetch artist details (max 50 per request)
    const allArtists: SpotifyArtist[] = [];
    const idArray = [...artistIds];
    for (let i = 0; i < idArray.length; i += 50) {
      const batch = idArray.slice(i, i + 50);
      const artistsRes = (await client.get(
        `/v1/artists?ids=${batch.join(",")}`
      )) as { artists: SpotifyArtist[] };
      allArtists.push(...artistsRes.artists);
    }

    // Count genres
    const genreCounts = new Map<string, number>();
    for (const artist of allArtists) {
      for (const genre of artist.genres) {
        genreCounts.set(genre, (genreCounts.get(genre) ?? 0) + 1);
      }
    }

    if (genreCounts.size === 0) {
      return "## Spotify Genre Breakdown\nNo genre data available for your artists.";
    }

    const sorted = [...genreCounts.entries()].sort((a, b) => b[1] - a[1]);
    const totalArtists = allArtists.length;

    const rows = sorted.map(([genre, count]) => {
      const pct = Math.round((count / totalArtists) * 100);
      return `| ${genre} | ${count} | ${pct}% |`;
    });

    const result = [
      `## Spotify Genre Breakdown (${totalArtists} artists analyzed)`,
      ``,
      `| Genre | Artists | % |`,
      `|-------|---------|---|`,
      ...rows,
    ].join("\n");

    spotifyCache.set(cacheKey, result);
    return result;
  } catch (error) {
    return `## Spotify Genre Breakdown\nError analyzing genres: ${error instanceof Error ? error.message : String(error)}`;
  }
}

export async function fetchSpotifyLibrarySummary(client: SpotifyClient): Promise<string> {
  const cacheKey = "spotify:summary:default";
  const cached = spotifyCache.get(cacheKey);
  if (cached) return cached;

  try {
    const [tracksRes, albumsRes, playlistsRes] = await Promise.all([
      client.get("/v1/me/tracks?limit=10") as Promise<SpotifyPaginated<SpotifySavedTrack>>,
      client.get("/v1/me/albums?limit=10") as Promise<SpotifyPaginated<SpotifySavedAlbum>>,
      client.get("/v1/me/playlists?limit=5") as Promise<SpotifyPaginated<SpotifyPlaylist>>,
    ]);

    const sections: string[] = [
      `## Spotify Library Summary`,
      ``,
      `- **Saved Tracks:** ${tracksRes.total}`,
      `- **Saved Albums:** ${albumsRes.total}`,
      `- **Playlists:** ${playlistsRes.total}`,
    ];

    if (tracksRes.items.length > 0) {
      sections.push(
        ``,
        `### Sample Tracks`,
        ...tracksRes.items.map((item, i) => {
          const t = item.track;
          const artists = t.artists.map((a) => a.name).join(", ");
          return `${i + 1}. "${t.name}" by ${artists} (${t.album.name})`;
        })
      );
    }

    if (albumsRes.items.length > 0) {
      sections.push(
        ``,
        `### Sample Albums`,
        ...albumsRes.items.map((item, i) => {
          const a = item.album;
          const artists = a.artists.map((ar) => ar.name).join(", ");
          return `${i + 1}. "${a.name}" by ${artists}`;
        })
      );
    }

    if (playlistsRes.items.length > 0) {
      sections.push(
        ``,
        `### Playlists`,
        ...playlistsRes.items.map((p, i) => `${i + 1}. "${p.name}" (${p.tracks.total} tracks)`)
      );
    }

    const result = sections.join("\n");
    spotifyCache.set(cacheKey, result);
    return result;
  } catch (error) {
    return `## Spotify Library Summary\nError fetching library summary: ${error instanceof Error ? error.message : String(error)}`;
  }
}
