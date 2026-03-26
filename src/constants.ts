import { homedir } from "node:os";
import { join } from "node:path";

export const EXTENSION_NAME = "pi-apple-music";
export const EXTENSION_COMMAND = "apple-music";
export const TOOL_NAME_LIBRARY = "apple_music_library";
export const TOOL_NAME_PLAYLIST = "apple_music_create_playlist";
export const STATE_ENTRY_TYPE = "apple-music:state";
export const TOOL_NAME_SEARCH = "apple_music_search";

export const API_BASE_URL = "https://api.music.apple.com";
export const DEFAULT_STOREFRONT = "us";

export const CONFIG_DIR = join(homedir(), ".pi-apple-music");
export const CONFIG_FILE = join(CONFIG_DIR, "config.json");

/** Maximum developer token lifetime: 6 months in seconds */
export const MAX_TOKEN_LIFETIME_SECONDS = 15777000;
