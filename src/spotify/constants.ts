import { homedir } from "node:os";
import { join } from "node:path";

export const SPOTIFY_API_BASE = "https://api.spotify.com";
export const SPOTIFY_ACCOUNTS_BASE = "https://accounts.spotify.com";
export const SPOTIFY_TOKEN_ENDPOINT = "https://accounts.spotify.com/api/token";
export const SPOTIFY_AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";

export const SPOTIFY_CONFIG_DIR = join(homedir(), ".pi-apple-music");
export const SPOTIFY_CONFIG_FILE = join(SPOTIFY_CONFIG_DIR, "spotify-config.json");

export const SPOTIFY_SCOPES = [
  "user-library-read",
  "user-read-recently-played",
  "user-top-read",
  "user-follow-read",
  "playlist-read-private",
  "playlist-read-collaborative",
  "playlist-modify-public",
  "playlist-modify-private",
] as const;

export const SPOTIFY_TOOL_NAME_LIBRARY = "spotify_library";
export const SPOTIFY_TOOL_NAME_SEARCH = "spotify_search";
export const SPOTIFY_TOOL_NAME_PLAYLIST = "spotify_playlist";
export const SPOTIFY_EXTENSION_COMMAND = "spotify";
