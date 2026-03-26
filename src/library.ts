import { type AppleMusicClient } from "./apple-music-client.js";
import {
  type AppleMusicResponse,
  type LibrarySongAttributes,
  type LibraryArtistAttributes,
  type LibraryAlbumAttributes,
  type LibraryPlaylistAttributes,
  type RecentlyPlayedAttributes,
} from "./types.js";
import { libraryCache } from "./cache.js";

function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export async function fetchLibrarySongs(client: AppleMusicClient, limit: number): Promise<string> {
  const cacheKey = `songs:${limit}`;
  const cached = libraryCache.get(cacheKey);
  if (cached) return cached;

  try {
    const response = (await client.get(
      `/v1/me/library/songs?limit=${limit}`
    )) as AppleMusicResponse<LibrarySongAttributes>;

    if (!response.data || response.data.length === 0) {
      return "## Library Songs\nNo songs found in library.";
    }

    const total = response.meta?.total ?? response.data.length;
    const lines = response.data.map((song, i) => {
      const attrs = song.attributes;
      const genres = attrs.genreNames.length > 0 ? ` [${attrs.genreNames.join(", ")}]` : "";
      const duration = formatDuration(attrs.durationInMillis);
      return `${i + 1}. "${attrs.name}" by ${attrs.artistName} (${attrs.albumName}) ${duration}${genres} (ID: ${song.id})`;
    });

    const result = `## Library Songs (${response.data.length} of ${total})\n\n${lines.join("\n")}`;
    libraryCache.set(cacheKey, result);
    return result;
  } catch (error) {
    return `## Library Songs\nError fetching songs: ${error instanceof Error ? error.message : String(error)}`;
  }
}

export async function fetchLibraryArtists(
  client: AppleMusicClient,
  limit: number
): Promise<string> {
  const cacheKey = `artists:${limit}`;
  const cached = libraryCache.get(cacheKey);
  if (cached) return cached;

  try {
    const response = (await client.get(
      `/v1/me/library/artists?limit=${limit}`
    )) as AppleMusicResponse<LibraryArtistAttributes>;

    if (!response.data || response.data.length === 0) {
      return "## Library Artists\nNo artists found in library.";
    }

    const total = response.meta?.total ?? response.data.length;
    const lines = response.data.map((artist, i) => `${i + 1}. ${artist.attributes.name}`);

    const result = `## Library Artists (${response.data.length} of ${total})\n\n${lines.join("\n")}`;
    libraryCache.set(cacheKey, result);
    return result;
  } catch (error) {
    return `## Library Artists\nError fetching artists: ${error instanceof Error ? error.message : String(error)}`;
  }
}

export async function fetchLibraryAlbums(client: AppleMusicClient, limit: number): Promise<string> {
  const cacheKey = `albums:${limit}`;
  const cached = libraryCache.get(cacheKey);
  if (cached) return cached;

  try {
    const response = (await client.get(
      `/v1/me/library/albums?limit=${limit}`
    )) as AppleMusicResponse<LibraryAlbumAttributes>;

    if (!response.data || response.data.length === 0) {
      return "## Library Albums\nNo albums found in library.";
    }

    const total = response.meta?.total ?? response.data.length;
    const lines = response.data.map((album, i) => {
      const attrs = album.attributes;
      const genres = attrs.genreNames.length > 0 ? ` [${attrs.genreNames.join(", ")}]` : "";
      const tracks = `${attrs.trackCount} track${attrs.trackCount !== 1 ? "s" : ""}`;
      return `${i + 1}. "${attrs.name}" by ${attrs.artistName} (${tracks})${genres}`;
    });

    const result = `## Library Albums (${response.data.length} of ${total})\n\n${lines.join("\n")}`;
    libraryCache.set(cacheKey, result);
    return result;
  } catch (error) {
    return `## Library Albums\nError fetching albums: ${error instanceof Error ? error.message : String(error)}`;
  }
}

export async function fetchLibraryPlaylists(
  client: AppleMusicClient,
  limit: number
): Promise<string> {
  const cacheKey = `playlists:${limit}`;
  const cached = libraryCache.get(cacheKey);
  if (cached) return cached;

  try {
    const response = (await client.get(
      `/v1/me/library/playlists?limit=${limit}`
    )) as AppleMusicResponse<LibraryPlaylistAttributes>;

    if (!response.data || response.data.length === 0) {
      return "## Library Playlists\nNo playlists found in library.";
    }

    const total = response.meta?.total ?? response.data.length;
    const lines = response.data.map((playlist, i) => {
      const attrs = playlist.attributes;
      const desc = attrs.description?.standard ? ` — ${attrs.description.standard}` : "";
      return `${i + 1}. "${attrs.name}" (ID: ${playlist.id})${desc}`;
    });

    const result = `## Library Playlists (${response.data.length} of ${total})\n\n${lines.join("\n")}`;
    libraryCache.set(cacheKey, result);
    return result;
  } catch (error) {
    return `## Library Playlists\nError fetching playlists: ${error instanceof Error ? error.message : String(error)}`;
  }
}

export async function fetchRecentlyPlayed(client: AppleMusicClient): Promise<string> {
  const cacheKey = "recent:10";
  const cached = libraryCache.get(cacheKey);
  if (cached) return cached;

  try {
    const response = (await client.get(
      `/v1/me/recent/played?limit=10`
    )) as AppleMusicResponse<RecentlyPlayedAttributes>;

    if (!response.data || response.data.length === 0) {
      return "## Recently Played\nNo recently played items found.";
    }

    const lines = response.data.map((item, i) => {
      const attrs = item.attributes;
      const artist = attrs.artistName ? ` by ${attrs.artistName}` : "";
      const type = item.type.replace("library-", "").replace(/s$/, "");
      return `${i + 1}. "${attrs.name}"${artist} (${type})`;
    });

    const result = `## Recently Played\n\n${lines.join("\n")}`;
    libraryCache.set(cacheKey, result);
    return result;
  } catch (error) {
    return `## Recently Played\nError fetching recently played: ${error instanceof Error ? error.message : String(error)}`;
  }
}

export async function fetchLibrarySummary(client: AppleMusicClient): Promise<string> {
  const cacheKey = "summary:default";
  const cached = libraryCache.get(cacheKey);
  if (cached) return cached;

  try {
    const [songsRes, artistsRes, albumsRes, playlistsRes] = await Promise.all([
      client.get("/v1/me/library/songs?limit=10") as Promise<
        AppleMusicResponse<LibrarySongAttributes>
      >,
      client.get("/v1/me/library/artists?limit=10") as Promise<
        AppleMusicResponse<LibraryArtistAttributes>
      >,
      client.get("/v1/me/library/albums?limit=10") as Promise<
        AppleMusicResponse<LibraryAlbumAttributes>
      >,
      client.get("/v1/me/library/playlists?limit=5") as Promise<
        AppleMusicResponse<LibraryPlaylistAttributes>
      >,
    ]);

    const songCount = songsRes.meta?.total ?? songsRes.data.length;
    const artistCount = artistsRes.meta?.total ?? artistsRes.data.length;
    const albumCount = albumsRes.meta?.total ?? albumsRes.data.length;
    const playlistCount = playlistsRes.meta?.total ?? playlistsRes.data.length;

    const sections: string[] = [
      `## Library Summary`,
      ``,
      `- **Songs:** ${songCount}`,
      `- **Artists:** ${artistCount}`,
      `- **Albums:** ${albumCount}`,
      `- **Playlists:** ${playlistCount}`,
    ];

    if (songsRes.data.length > 0) {
      sections.push(
        ``,
        `### Sample Songs`,
        ...songsRes.data.map((s, i) => {
          const a = s.attributes;
          return `${i + 1}. "${a.name}" by ${a.artistName} (${a.albumName})`;
        })
      );
    }

    if (artistsRes.data.length > 0) {
      sections.push(
        ``,
        `### Sample Artists`,
        ...artistsRes.data.map((a, i) => `${i + 1}. ${a.attributes.name}`)
      );
    }

    if (albumsRes.data.length > 0) {
      sections.push(
        ``,
        `### Sample Albums`,
        ...albumsRes.data.map((a, i) => {
          const attrs = a.attributes;
          return `${i + 1}. "${attrs.name}" by ${attrs.artistName}`;
        })
      );
    }

    if (playlistsRes.data.length > 0) {
      sections.push(
        ``,
        `### Playlists`,
        ...playlistsRes.data.map((p, i) => `${i + 1}. "${p.attributes.name}"`)
      );
    }

    const result = sections.join("\n");
    libraryCache.set(cacheKey, result);
    return result;
  } catch (error) {
    return `## Library Summary\nError fetching library summary: ${error instanceof Error ? error.message : String(error)}`;
  }
}

export async function fetchGenreBreakdown(
  client: AppleMusicClient,
  limit: number
): Promise<string> {
  const cacheKey = `genres:${limit}`;
  const cached = libraryCache.get(cacheKey);
  if (cached) return cached;

  try {
    const response = (await client.get(
      `/v1/me/library/songs?limit=${limit}`
    )) as AppleMusicResponse<LibrarySongAttributes>;

    if (!response.data || response.data.length === 0) {
      return "## Genre Breakdown\nNo songs found in library.";
    }

    const genreCounts = new Map<string, number>();
    for (const song of response.data) {
      for (const genre of song.attributes.genreNames) {
        genreCounts.set(genre, (genreCounts.get(genre) ?? 0) + 1);
      }
    }

    const sorted = [...genreCounts.entries()].sort((a, b) => b[1] - a[1]);
    const totalSongs = response.data.length;

    const rows = sorted.map(([genre, count]) => {
      const pct = Math.round((count / totalSongs) * 100);
      return `| ${genre} | ${count} | ${pct}% |`;
    });

    const result = [
      `## Genre Breakdown (${totalSongs} songs analyzed)`,
      ``,
      `| Genre | Songs | % |`,
      `|-------|-------|---|`,
      ...rows,
    ].join("\n");

    libraryCache.set(cacheKey, result);
    return result;
  } catch (error) {
    return `## Genre Breakdown\nError analyzing genres: ${error instanceof Error ? error.message : String(error)}`;
  }
}

export async function fetchTopArtists(client: AppleMusicClient, limit: number): Promise<string> {
  const cacheKey = `top-artists:${limit}`;
  const cached = libraryCache.get(cacheKey);
  if (cached) return cached;

  try {
    // Fetch more songs for better analysis, use limit for output count
    const fetchLimit = Math.max(limit * 10, 200);
    const response = (await client.get(
      `/v1/me/library/songs?limit=${fetchLimit}`
    )) as AppleMusicResponse<LibrarySongAttributes>;

    if (!response.data || response.data.length === 0) {
      return "## Top Artists\nNo songs found in library.";
    }

    const artistCounts = new Map<string, number>();
    for (const song of response.data) {
      const artist = song.attributes.artistName;
      artistCounts.set(artist, (artistCounts.get(artist) ?? 0) + 1);
    }

    const sorted = [...artistCounts.entries()].sort((a, b) => b[1] - a[1]);
    const top = sorted.slice(0, limit);
    const uniqueArtists = artistCounts.size;
    const totalSongs = response.data.length;

    const lines = top.map(
      ([artist, count], i) => `${i + 1}. ${artist} (${count} song${count !== 1 ? "s" : ""})`
    );

    const result = [
      `## Top Artists (${uniqueArtists} artists from ${totalSongs} songs)`,
      ``,
      ...lines,
    ].join("\n");

    libraryCache.set(cacheKey, result);
    return result;
  } catch (error) {
    return `## Top Artists\nError analyzing artists: ${error instanceof Error ? error.message : String(error)}`;
  }
}
