export interface SpotifyConfig {
  clientId: string;
  accessToken?: string | undefined;
  refreshToken?: string | undefined;
  /** Unix timestamp in seconds when the access token expires */
  expiresAt?: number | undefined;
}

// Spotify API response types

export interface SpotifyPaginated<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  next: string | null;
}

export interface SpotifyArtistRef {
  name: string;
  id: string;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: SpotifyArtistRef[];
  album: { name: string };
  duration_ms: number;
  uri: string;
}

export interface SpotifySavedTrack {
  added_at: string;
  track: SpotifyTrack;
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  artists: { name: string }[];
  total_tracks: number;
  release_date: string;
  album_type: string;
}

export interface SpotifySavedAlbum {
  added_at: string;
  album: SpotifyAlbum;
}

export interface SpotifyArtist {
  id: string;
  name: string;
  genres: string[];
  popularity: number;
}

export interface SpotifyFollowedArtists {
  artists: {
    items: SpotifyArtist[];
    total: number;
    cursors: { after: string | null };
  };
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string | null;
  tracks: { total: number };
  owner: { display_name: string };
  public: boolean | null;
}

export interface SpotifyRecentlyPlayed {
  items: { track: SpotifyTrack; played_at: string }[];
  next: string | null;
}

export interface SpotifyTopItems<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface SpotifySearchResponse {
  tracks: SpotifyPaginated<SpotifyTrack>;
}

export interface SpotifyCreatePlaylistResponse {
  id: string;
  name: string;
  external_urls: { spotify: string };
  tracks: { total: number };
}
