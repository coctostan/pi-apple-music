export interface AppleMusicConfig {
  teamId: string;
  keyId: string;
  privateKeyPath: string;
  musicUserToken?: string | undefined;
}

export interface ExtensionState {
  configured: boolean;
  lastSync?: string | undefined;
}

// Apple Music API response types

export interface AppleMusicResource<T> {
  id: string;
  type: string;
  href?: string | undefined;
  attributes: T;
}

export interface AppleMusicResponse<T> {
  data: AppleMusicResource<T>[];
  next?: string | undefined;
  meta?: { total: number } | undefined;
}

export interface LibrarySongAttributes {
  name: string;
  artistName: string;
  albumName: string;
  genreNames: string[];
  durationInMillis: number;
  trackNumber?: number | undefined;
}

export interface LibraryArtistAttributes {
  name: string;
}

export interface LibraryAlbumAttributes {
  name: string;
  artistName: string;
  trackCount: number;
  genreNames: string[];
  releaseDate?: string | undefined;
  dateAdded?: string | undefined;
}

export interface LibraryPlaylistAttributes {
  name: string;
  dateAdded?: string | undefined;
  canEdit?: boolean | undefined;
  isPublic?: boolean | undefined;
  description?: { standard?: string | undefined } | undefined;
}

export interface RecentlyPlayedAttributes {
  name: string;
  artistName?: string | undefined;
  artwork?: { url?: string | undefined } | undefined;
}

export interface CatalogSongAttributes {
  name: string;
  artistName: string;
  albumName: string;
  genreNames: string[];
  durationInMillis: number;
  url?: string | undefined;
}

export interface SearchResponse {
  results: {
    songs?: {
      data: AppleMusicResource<CatalogSongAttributes>[];
      next?: string | undefined;
    };
  };
}

export interface CreatePlaylistRequest {
  attributes: {
    name: string;
    description?: string | undefined;
  };
  relationships?: {
    tracks: {
      data: { id: string; type: string }[];
    };
  };
}

export interface LibraryPlaylistResponse {
  data: AppleMusicResource<LibraryPlaylistAttributes>[];
}
