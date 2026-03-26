import { type AppleMusicConfig } from "./types.js";
import { API_BASE_URL } from "./constants.js";
import { generateDeveloperToken } from "./auth.js";

export class AppleMusicClient {
  private config: AppleMusicConfig;

  constructor(config: AppleMusicConfig) {
    this.config = config;
  }

  private getHeaders(): Record<string, string> {
    const token = generateDeveloperToken(this.config);
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    if (this.config.musicUserToken) {
      headers["Music-User-Token"] = this.config.musicUserToken;
    }

    return headers;
  }

  async get(path: string): Promise<unknown> {
    const url = `${API_BASE_URL}${path}`;
    const response = await fetch(url, {
      method: "GET",
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(
        `Apple Music API error: ${response.status} ${response.statusText}${body ? ` — ${body}` : ""}`
      );
    }

    return await response.json();
  }

  async post(path: string, body: unknown): Promise<unknown> {
    const url = `${API_BASE_URL}${path}`;
    const response = await fetch(url, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      throw new Error(
        `Apple Music API error: ${response.status} ${response.statusText}${errorBody ? ` — ${errorBody}` : ""}`
      );
    }

    if (response.status === 204) return null;
    return await response.json();
  }
}

export function createClient(config: AppleMusicConfig): AppleMusicClient {
  return new AppleMusicClient(config);
}
