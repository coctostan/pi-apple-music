import { type SpotifyClient } from "./spotify-client.js";
import {
  type SpotifySearchResponse,
  type SpotifyCreatePlaylistResponse,
} from "./types.js";
import { spotifyCache } from "./cache.js";

export async function searchSpotifyCatalog(
  client: SpotifyClient,
  term: string,
  limit: number = 10
): Promise<string> {
  const cacheKey = `spotify:search:${term}:${limit}`;
  const cached = spotifyCache.get(cacheKey);
  if (cached) return cached;

  try {
    const encoded = encodeURIComponent(term);
    // Spotify Feb 2026: search limit max reduced to 10
    const effectiveLimit = Math.min(limit, 10);
    const response = (await client.get(
      `/v1/search?q=${encoded}&type=track&limit=${effectiveLimit}`
    )) as SpotifySearchResponse;

    const tracks = response.tracks?.items;
    if (!tracks || tracks.length === 0) {
      return `## Spotify Search Results for "${term}"\nNo tracks found matching "${term}".`;
    }

    const lines = tracks.map((t, i) => {
      const artists = t.artists.map((a) => a.name).join(", ");
      return `${i + 1}. "${t.name}" by ${artists} (${t.album.name}) — URI: ${t.uri}`;
    });

    const result = [
      `## Spotify Search Results for "${term}" (${tracks.length} found)`,
      ``,
      `Use the URI values below with spotify_playlist to add these tracks to a playlist.`,
      ``,
      ...lines,
    ].join("\n");

    spotifyCache.set(cacheKey, result);
    return result;
  } catch (error) {
    return `## Spotify Search Results\nError searching catalog: ${error instanceof Error ? error.message : String(error)}`;
  }
}

export async function createSpotifyPlaylist(
  client: SpotifyClient,
  name: string,
  description: string | undefined,
  trackUris: string[],
  existingTrackUris?: Set<string>
): Promise<string> {
  try {
    // Step 1: Create the playlist
    const createBody: { name: string; description?: string; public: boolean } = {
      name,
      public: false,
    };
    if (description) {
      createBody.description = description;
    }

    const response = (await client.post(
      "/v1/me/playlists",
      createBody
    )) as SpotifyCreatePlaylistResponse;

    const playlistId = response.id;
    const playlistUrl = response.external_urls.spotify;
    const playlistName = response.name;

    // Step 2: Add tracks if any
    if (trackUris.length > 0) {
      await client.post(`/v1/playlists/${playlistId}/tracks`, {
        uris: trackUris,
      });
    }

    const sections = [
      `## Spotify Playlist Created ✓`,
      ``,
      `**Name:** ${playlistName}`,
      `**Description:** ${description ?? "None"}`,
      `**Tracks added:** ${trackUris.length}`,
      `**URL:** ${playlistUrl}`,
    ];

    if (existingTrackUris && existingTrackUris.size > 0) {
      const dupes = trackUris.filter((uri) => existingTrackUris.has(uri));
      if (dupes.length > 0) {
        sections.push(``, `**Note:** ${dupes.length} track(s) may already be in your library.`);
      }
    }

    sections.push(
      ``,
      `The playlist "${playlistName}" has been created in your Spotify account.`
    );

    return sections.join("\n");
  } catch (error) {
    return `## Spotify Playlist Creation Failed\nError creating playlist: ${error instanceof Error ? error.message : String(error)}`;
  }
}

export async function addTracksToSpotifyPlaylist(
  client: SpotifyClient,
  playlistId: string,
  trackUris: string[]
): Promise<string> {
  try {
    await client.post(`/v1/playlists/${playlistId}/tracks`, {
      uris: trackUris,
    });

    return [
      `## Spotify Tracks Added ✓`,
      ``,
      `**Playlist ID:** ${playlistId}`,
      `**Tracks added:** ${trackUris.length}`,
      ``,
      `Successfully added ${trackUris.length} track${trackUris.length !== 1 ? "s" : ""} to the playlist.`,
    ].join("\n");
  } catch (error) {
    return `## Spotify Add Tracks Failed\nError adding tracks: ${error instanceof Error ? error.message : String(error)}`;
  }
}
