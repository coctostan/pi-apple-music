import { Type } from "@sinclair/typebox";
import { StringEnum } from "@mariozechner/pi-ai";
import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";
import {
  EXTENSION_COMMAND,
  EXTENSION_NAME,
  TOOL_NAME_LIBRARY,
  TOOL_NAME_PLAYLIST,
  TOOL_NAME_SEARCH,
  CONFIG_DIR,
  DEFAULT_STOREFRONT,
} from "./constants.js";
import { loadConfig, isConfigured } from "./config.js";
import { type AppleMusicConfig } from "./types.js";
import { createClient } from "./apple-music-client.js";
import { libraryCache } from "./cache.js";
import {
  fetchLibrarySongs,
  fetchLibraryArtists,
  fetchLibraryAlbums,
  fetchLibraryPlaylists,
  fetchRecentlyPlayed,
  fetchLibrarySummary,
  fetchGenreBreakdown,
  fetchTopArtists,
} from "./library.js";
import { searchCatalog, createPlaylist, addTracksToPlaylist } from "./playlist.js";
import {
  renderLibraryCall,
  renderLibraryResult,
  renderSearchCall,
  renderSearchResult,
  renderPlaylistCall,
  renderPlaylistResult,
} from "./render.js";

export default function piAppleMusic(pi: ExtensionAPI) {
  let config: AppleMusicConfig | null = null;

  function syncConfig(ctx: Pick<ExtensionContext, "hasUI" | "ui">): void {
    config = loadConfig();
    if (ctx.hasUI) {
      const status = isConfigured(config)
        ? `${EXTENSION_NAME}: ✓ configured`
        : `${EXTENSION_NAME}: ✗ not configured`;
      ctx.ui.setStatus(EXTENSION_COMMAND, status);
    }
  }

  pi.on("session_start", (_event, ctx) => syncConfig(ctx));
  pi.on("session_switch", (_event, ctx) => syncConfig(ctx));

  pi.registerCommand(EXTENSION_COMMAND, {
    description: "Apple Music playlist generator — status, config, help",
    getArgumentCompletions: (prefix) => {
      const options = ["status", "config", "cache-clear", "help"];
      const safePrefix = prefix.toLowerCase();
      const matches = options.filter((o) => o.startsWith(safePrefix));
      return matches.length > 0 ? matches.map((value) => ({ value, label: value })) : null;
    },
    handler: (args, ctx): Promise<void> => {
      const subcommand = args.trim().toLowerCase();

      switch (subcommand) {
        case "status": {
          config = loadConfig();
          const configured = isConfigured(config);
          const hasUserToken = configured && !!config?.musicUserToken;
          const cacheStats = libraryCache.stats();
          const cacheAge =
            cacheStats.oldestAgeSec !== null ? `${cacheStats.oldestAgeSec}s ago` : "empty";
          const lines = [
            `Apple Music Extension Status`,
            `  Configured: ${configured ? "✓ yes" : "✗ no"}`,
            `  Music User Token: ${hasUserToken ? "✓ present" : "✗ not set"}`,
            `  Cache: ${cacheStats.entries} entries (oldest: ${cacheAge})`,
            `  Config location: ${CONFIG_DIR}/config.json`,
          ];
          notify(ctx, lines.join("\n"));
          return Promise.resolve();
        }

        case "cache-clear": {
          libraryCache.clear();
          notify(ctx, "Library cache cleared. Next request will fetch fresh data.");
          return Promise.resolve();
        }

        case "config": {
          const instructions = [
            `To configure pi-apple-music, create ${CONFIG_DIR}/config.json with:`,
            ``,
            `{`,
            `  "teamId": "YOUR_10_CHAR_TEAM_ID",`,
            `  "keyId": "YOUR_10_CHAR_KEY_ID",`,
            `  "privateKeyPath": "/path/to/AuthKey_XXXXXXXXXX.p8",`,
            `  "musicUserToken": "OPTIONAL_USER_TOKEN"`,
            `}`,
            ``,
            `Required:`,
            `  • teamId — Your Apple Developer Team ID (10 characters)`,
            `  • keyId — Your MusicKit Key ID (10 characters)`,
            `  • privateKeyPath — Path to your .p8 private key file`,
            ``,
            `Optional:`,
            `  • musicUserToken — Required for accessing your personal library.`,
            `    Get this via MusicKit on the Web or MusicKit JS authorization flow.`,
            `    Token is valid for up to 180 days.`,
          ];
          notify(ctx, instructions.join("\n"));
          return Promise.resolve();
        }

        default:
          notify(
            ctx,
            [
              `/${EXTENSION_COMMAND} status       — show configuration and cache state`,
              `/${EXTENSION_COMMAND} config       — show configuration instructions`,
              `/${EXTENSION_COMMAND} cache-clear  — clear library cache`,
              `/${EXTENSION_COMMAND} help         — show this help`,
            ].join("\n")
          );
          return Promise.resolve();
      }
    },
  });

  // --- Library Tool ---
  pi.registerTool({
    name: TOOL_NAME_LIBRARY,
    label: "Apple Music Library",
    description:
      "Read the user's Apple Music library data including songs, artists, albums, and playlists. Returns structured library data for analysis.",
    parameters: Type.Object({
      action: StringEnum(
        [
          "songs",
          "artists",
          "albums",
          "playlists",
          "recent",
          "summary",
          "genres",
          "top-artists",
        ] as const,
        { description: "Type of library data to retrieve" }
      ),
      limit: Type.Optional(
        Type.Number({
          description: "Maximum number of items to return (default: 50)",
          default: 50,
        })
      ),
    }),
    async execute(_toolCallId, params) {
      const currentConfig = loadConfig();
      if (!isConfigured(currentConfig)) {
        return {
          content: [
            {
              type: "text" as const,
              text: "Apple Music is not configured. Run /apple-music config for setup instructions.",
            },
          ],
          details: { configured: false, action: params.action },
        };
      }

      if (!currentConfig.musicUserToken) {
        return {
          content: [
            {
              type: "text" as const,
              text: 'Apple Music is configured but no Music User Token is set. A Music User Token is required to access your personal library. Add "musicUserToken" to your config file.',
            },
          ],
          details: { configured: true, action: params.action },
        };
      }

      const client = createClient(currentConfig);
      let result: string;

      switch (params.action) {
        case "songs":
          result = await fetchLibrarySongs(client, params.limit ?? 50);
          break;
        case "artists":
          result = await fetchLibraryArtists(client, params.limit ?? 50);
          break;
        case "albums":
          result = await fetchLibraryAlbums(client, params.limit ?? 50);
          break;
        case "playlists":
          result = await fetchLibraryPlaylists(client, params.limit ?? 50);
          break;
        case "recent":
          result = await fetchRecentlyPlayed(client);
          break;
        case "summary":
          result = await fetchLibrarySummary(client);
          break;
        case "genres":
          result = await fetchGenreBreakdown(client, params.limit ?? 100);
          break;
        case "top-artists":
          result = await fetchTopArtists(client, params.limit ?? 20);
          break;
      }

      return {
        content: [{ type: "text" as const, text: result }],
        details: { action: params.action, configured: true },
      };
    },
    renderCall: renderLibraryCall,
    renderResult: renderLibraryResult,
  });

  // --- Search Tool ---
  pi.registerTool({
    name: TOOL_NAME_SEARCH,
    label: "Search Apple Music",
    description:
      "Search the Apple Music catalog for songs by name, artist, or keywords. Returns matching songs with their catalog IDs that can be used with apple_music_create_playlist.",
    parameters: Type.Object({
      term: Type.String({ description: "Search query (song name, artist, keywords)" }),
      limit: Type.Optional(
        Type.Number({
          description: "Maximum results to return (default: 25)",
          default: 25,
        })
      ),
      storefront: Type.Optional(
        Type.String({
          description: 'Apple Music storefront country code (default: "us")',
          default: DEFAULT_STOREFRONT,
        })
      ),
    }),
    async execute(_toolCallId, params) {
      const currentConfig = loadConfig();
      // Catalog search only needs a developer token, NOT a music user token
      if (!isConfigured(currentConfig)) {
        return {
          content: [
            {
              type: "text" as const,
              text: "Apple Music is not configured. Run /apple-music config for setup instructions.",
            },
          ],
          details: { configured: false, term: params.term },
        };
      }

      const client = createClient(currentConfig);
      const result = await searchCatalog(
        client,
        params.term,
        params.limit ?? 25,
        params.storefront ?? DEFAULT_STOREFRONT
      );

      return {
        content: [{ type: "text" as const, text: result }],
        details: { term: params.term, configured: true },
      };
    },
    renderCall: renderSearchCall,
    renderResult: renderSearchResult,
  });

  // --- Playlist Tool ---
  pi.registerTool({
    name: TOOL_NAME_PLAYLIST,
    label: "Apple Music Playlist",
    description:
      'Manage Apple Music playlists. Use action "create" to make a new playlist, or "add-tracks" to add songs to an existing playlist. Use apple_music_search to find track IDs and apple_music_library action "playlists" to find playlist IDs.',
    parameters: Type.Object({
      action: StringEnum(["create", "add-tracks"] as const, {
        description: 'Action to perform (default: "create")',
      }),
      name: Type.Optional(
        Type.String({ description: "Name of the new playlist (required for create)" })
      ),
      description: Type.Optional(
        Type.String({ description: "Description for the playlist (create only)" })
      ),
      playlistId: Type.Optional(
        Type.String({
          description:
            "ID of existing playlist (required for add-tracks, from library playlists listing)",
        })
      ),
      trackIds: Type.Array(
        Type.String({ description: "Apple Music catalog or library track ID" }),
        {
          description: "Array of track IDs (from apple_music_search results)",
        }
      ),
    }),
    async execute(_toolCallId, params) {
      const currentConfig = loadConfig();
      if (!isConfigured(currentConfig)) {
        return {
          content: [
            {
              type: "text" as const,
              text: "Apple Music is not configured. Run /apple-music config for setup instructions.",
            },
          ],
          details: {
            configured: false,
            action: params.action,
            playlistId: params.playlistId ?? "",
            playlistName: params.name ?? "",
          },
        };
      }
      if (!currentConfig.musicUserToken) {
        return {
          content: [
            {
              type: "text" as const,
              text: 'Apple Music is configured but no Music User Token is set. A Music User Token is required for playlist operations. Add "musicUserToken" to your config file.',
            },
          ],
          details: {
            configured: true,
            action: params.action,
            playlistId: params.playlistId ?? "",
            playlistName: params.name ?? "",
          },
        };
      }

      const client = createClient(currentConfig);

      if (params.action === "add-tracks") {
        if (!params.playlistId) {
          return {
            content: [
              {
                type: "text" as const,
                text: 'playlistId is required for add-tracks action. Use apple_music_library with action "playlists" to find playlist IDs.',
              },
            ],
            details: { configured: true, action: params.action, playlistId: "", playlistName: "" },
          };
        }
        const result = await addTracksToPlaylist(client, params.playlistId, params.trackIds);
        return {
          content: [{ type: "text" as const, text: result }],
          details: {
            action: params.action,
            playlistId: params.playlistId,
            playlistName: "",
            configured: true,
          },
        };
      }

      // Default: create
      if (!params.name) {
        return {
          content: [
            {
              type: "text" as const,
              text: "name is required for create action.",
            },
          ],
          details: { configured: true, action: params.action, playlistId: "", playlistName: "" },
        };
      }
      // Best-effort dedup: fetch library song IDs for comparison
      let libraryIds: Set<string> | undefined;
      try {
        const libRes = (await client.get("/v1/me/library/songs?limit=200")) as {
          data?: { id: string }[];
        };
        if (libRes.data && libRes.data.length > 0) {
          libraryIds = new Set(libRes.data.map((s) => s.id));
        }
      } catch {
        // Dedup is best-effort — continue without it
      }
      const result = await createPlaylist(
        client,
        params.name,
        params.description,
        params.trackIds,
        libraryIds
      );
      return {
        content: [{ type: "text" as const, text: result }],
        details: {
          action: params.action,
          playlistName: params.name,
          playlistId: "",
          configured: true,
        },
      };
    },
    renderCall: renderPlaylistCall,
    renderResult: renderPlaylistResult,
  });
}

function notify(
  ctx: { hasUI: boolean; ui: { notify: (message: string, level: "info") => void } },
  message: string
): void {
  if (ctx.hasUI) {
    ctx.ui.notify(message, "info");
  } else {
    console.log(message);
  }
}
