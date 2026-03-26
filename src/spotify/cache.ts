import { LibraryCache } from "../cache.js";

/** Spotify-specific cache instance (same 5-min TTL as Apple Music) */
export const spotifyCache = new LibraryCache();
