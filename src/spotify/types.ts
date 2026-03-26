export interface SpotifyConfig {
  clientId: string;
  accessToken?: string | undefined;
  refreshToken?: string | undefined;
  /** Unix timestamp in seconds when the access token expires */
  expiresAt?: number | undefined;
}
