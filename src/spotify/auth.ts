import { randomBytes, createHash } from "node:crypto";
import { type SpotifyConfig } from "./types.js";
import { SPOTIFY_TOKEN_ENDPOINT, SPOTIFY_AUTH_ENDPOINT, SPOTIFY_SCOPES } from "./constants.js";

/**
 * Check if the access token is expired or will expire within 60 seconds.
 */
export function isTokenExpired(config: SpotifyConfig): boolean {
  if (!config.expiresAt) return true;
  const now = Math.floor(Date.now() / 1000);
  return now >= config.expiresAt - 60;
}

/**
 * Refresh the access token using the refresh token (PKCE — no client_secret needed).
 */
export async function refreshAccessToken(
  config: SpotifyConfig
): Promise<{ accessToken: string; expiresAt: number }> {
  if (!config.refreshToken) {
    throw new Error("Cannot refresh: no refresh token available");
  }

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: config.refreshToken,
    client_id: config.clientId,
  });

  const response = await fetch(SPOTIFY_TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(
      `Spotify token refresh failed: ${response.status} ${response.statusText}${errorBody ? ` — ${errorBody}` : ""}`
    );
  }

  const data = (await response.json()) as { access_token: string; expires_in: number; refresh_token?: string };
  const expiresAt = Math.floor(Date.now() / 1000) + data.expires_in;

  return {
    accessToken: data.access_token,
    expiresAt,
  };
}

/**
 * Generate a PKCE code verifier and code challenge pair.
 */
export function generatePKCEChallenge(): { codeVerifier: string; codeChallenge: string } {
  // Generate a random 64-byte buffer, encode as base64url for verifier (86 chars)
  const codeVerifier = randomBytes(64)
    .toString("base64url")
    .slice(0, 86);

  const codeChallenge = createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");

  return { codeVerifier, codeChallenge };
}

/**
 * Build the Spotify authorization URL for the PKCE flow.
 */
export function buildAuthURL(
  clientId: string,
  redirectUri: string,
  codeChallenge: string
): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    scope: SPOTIFY_SCOPES.join(" "),
    redirect_uri: redirectUri,
    code_challenge_method: "S256",
    code_challenge: codeChallenge,
  });

  return `${SPOTIFY_AUTH_ENDPOINT}?${params.toString()}`;
}
