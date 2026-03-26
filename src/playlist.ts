import { type AppleMusicClient } from "./apple-music-client.js";
import {
  type SearchResponse,
  type CreatePlaylistRequest,
  type LibraryPlaylistResponse,
} from "./types.js";
import { DEFAULT_STOREFRONT } from "./constants.js";

export async function searchCatalog(
  client: AppleMusicClient,
  term: string,
  limit: number,
  storefront?: string
): Promise<string> {
  try {
    const sf = storefront ?? DEFAULT_STOREFRONT;
    const encoded = encodeURIComponent(term);
    const response = (await client.get(
      `/v1/catalog/${sf}/search?types=songs&term=${encoded}&limit=${limit}`
    )) as SearchResponse;

    const songs = response.results.songs?.data;
    if (!songs || songs.length === 0) {
      return `## Search Results for "${term}"\nNo songs found matching "${term}".`;
    }

    const lines = songs.map((song, i) => {
      const a = song.attributes;
      return `${i + 1}. "${a.name}" by ${a.artistName} (${a.albumName}) — ID: ${song.id}`;
    });

    return [
      `## Search Results for "${term}" (${songs.length} found)`,
      ``,
      `Use the ID values below with apple_music_create_playlist to add these songs to a playlist.`,
      ``,
      ...lines,
    ].join("\n");
  } catch (error) {
    return `## Search Results\nError searching catalog: ${error instanceof Error ? error.message : String(error)}`;
  }
}

/**
 * Detect whether a track ID is a library ID or a catalog ID.
 * Library IDs typically start with "i." prefix.
 * Catalog IDs are numeric strings.
 */
function getTrackType(id: string): string {
  return id.startsWith("i.") ? "library-songs" : "songs";
}

export async function createPlaylist(
  client: AppleMusicClient,
  name: string,
  description: string | undefined,
  trackIds: string[]
): Promise<string> {
  try {
    const body: CreatePlaylistRequest = {
      attributes: {
        name,
      },
    };

    if (description) {
      body.attributes.description = description;
    }

    if (trackIds.length > 0) {
      body.relationships = {
        tracks: {
          data: trackIds.map((id) => ({
            id,
            type: getTrackType(id),
          })),
        },
      };
    }

    const response = (await client.post(
      "/v1/me/library/playlists",
      body
    )) as LibraryPlaylistResponse;

    const createdName = response.data[0]?.attributes.name ?? name;

    return [
      `## Playlist Created ✓`,
      ``,
      `**Name:** ${createdName}`,
      `**Description:** ${description ?? "None"}`,
      `**Tracks added:** ${trackIds.length}`,
      ``,
      `The playlist "${createdName}" has been created in your Apple Music library.`,
    ].join("\n");
  } catch (error) {
    return `## Playlist Creation Failed\nError creating playlist: ${error instanceof Error ? error.message : String(error)}`;
  }
}
