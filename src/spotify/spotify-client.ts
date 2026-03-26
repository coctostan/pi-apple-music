import { type SpotifyConfig } from "./types.js";
import { SPOTIFY_API_BASE } from "./constants.js";
import { isTokenExpired, refreshAccessToken } from "./auth.js";

export class SpotifyClient {
  private config: SpotifyConfig;
  private saveConfig: (config: SpotifyConfig) => void;

  constructor(config: SpotifyConfig, saveConfig: (config: SpotifyConfig) => void) {
    this.config = config;
    this.saveConfig = saveConfig;
  }

  private async ensureValidToken(): Promise<void> {
    if (isTokenExpired(this.config) && this.config.refreshToken) {
      const { accessToken, expiresAt } = await refreshAccessToken(this.config);
      this.config = {
        ...this.config,
        accessToken,
        expiresAt,
      };
      this.saveConfig(this.config);
    }
  }

  private getHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.config.accessToken}`,
      "Content-Type": "application/json",
    };
  }

  async get(path: string): Promise<unknown> {
    await this.ensureValidToken();
    const url = `${SPOTIFY_API_BASE}${path}`;
    const response = await fetch(url, {
      method: "GET",
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(
        `Spotify API error: ${response.status} ${response.statusText}${body ? ` — ${body}` : ""}`
      );
    }

    return await response.json();
  }

  async post(path: string, body: unknown): Promise<unknown> {
    await this.ensureValidToken();
    const url = `${SPOTIFY_API_BASE}${path}`;
    const response = await fetch(url, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      throw new Error(
        `Spotify API error: ${response.status} ${response.statusText}${errorBody ? ` — ${errorBody}` : ""}`
      );
    }

    if (response.status === 204) return null;
    return await response.json();
  }
}

export function createSpotifyClient(
  config: SpotifyConfig,
  saveConfig: (config: SpotifyConfig) => void
): SpotifyClient {
  return new SpotifyClient(config, saveConfig);
}
