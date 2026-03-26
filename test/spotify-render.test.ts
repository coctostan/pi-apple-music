import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  renderSpotifyLibraryCall,
  renderSpotifyLibraryResult,
  renderSpotifySearchCall,
  renderSpotifySearchResult,
  renderSpotifyPlaylistCall,
  renderSpotifyPlaylistResult,
} from "../src/spotify/render.js";

const theme = {
  fg(_color: string, text: string): string { return text; },
  bold(text: string): string { return text; },
};

function getText(component: { render(width: number): string[] }): string {
  return component.render(100).join("\n");
}

describe("renderSpotifyLibraryCall", () => {
  it("includes action name", () => {
    const result = renderSpotifyLibraryCall({ action: "songs" }, theme);
    assert.ok(getText(result).includes("Spotify Library"));
    assert.ok(getText(result).includes("songs"));
  });

  it("shows limit when provided", () => {
    const result = renderSpotifyLibraryCall({ action: "albums", limit: 25 }, theme);
    assert.ok(getText(result).includes("limit: 25"));
  });
});

describe("renderSpotifyLibraryResult", () => {
  it("shows success with summary", () => {
    const result = renderSpotifyLibraryResult(
      { content: [{ type: "text", text: "## Spotify Saved Tracks (50 of 500)\n\n1. Song" }] },
      { expanded: false, isPartial: false },
      theme
    );
    assert.ok(getText(result).includes("✓"));
    assert.ok(getText(result).includes("Spotify Saved Tracks"));
  });

  it("shows error state", () => {
    const result = renderSpotifyLibraryResult(
      { content: [{ type: "text", text: "Error fetching tracks" }] },
      { expanded: false, isPartial: false },
      theme
    );
    assert.ok(getText(result).includes("✗"));
  });

  it("shows loading state", () => {
    const result = renderSpotifyLibraryResult(
      { content: [] },
      { expanded: false, isPartial: true },
      theme
    );
    assert.ok(getText(result).includes("⏳"));
    assert.ok(getText(result).includes("Fetching Spotify"));
  });

  it("shows full content when expanded", () => {
    const result = renderSpotifyLibraryResult(
      { content: [{ type: "text", text: "## Tracks\n\n1. Song One\n2. Song Two" }] },
      { expanded: true, isPartial: false },
      theme
    );
    assert.ok(getText(result).includes("Song One"));
    assert.ok(getText(result).includes("Song Two"));
  });
});

describe("renderSpotifySearchCall", () => {
  it("includes search term", () => {
    const result = renderSpotifySearchCall({ term: "bohemian rhapsody" }, theme);
    assert.ok(getText(result).includes("Spotify Search"));
    assert.ok(getText(result).includes("bohemian rhapsody"));
  });
});

describe("renderSpotifySearchResult", () => {
  it("shows result count on success", () => {
    const result = renderSpotifySearchResult(
      { content: [{ type: "text", text: '## Spotify Search Results for "test" (5 found)\n\n1. Song' }] },
      { expanded: false, isPartial: false },
      theme
    );
    assert.ok(getText(result).includes("✓"));
    assert.ok(getText(result).includes("5 found"));
  });

  it("shows no results state", () => {
    const result = renderSpotifySearchResult(
      { content: [{ type: "text", text: "No tracks found" }] },
      { expanded: false, isPartial: false },
      theme
    );
    assert.ok(getText(result).includes("○"));
  });
});

describe("renderSpotifyPlaylistCall", () => {
  it("shows create action with name", () => {
    const result = renderSpotifyPlaylistCall({ action: "create", name: "My Mix" }, theme);
    assert.ok(getText(result).includes("Create Spotify playlist"));
    assert.ok(getText(result).includes("My Mix"));
  });

  it("shows add-tracks action with playlist ID", () => {
    const result = renderSpotifyPlaylistCall({ action: "add-tracks", playlistId: "pl-123" }, theme);
    assert.ok(getText(result).includes("Add Spotify tracks"));
    assert.ok(getText(result).includes("pl-123"));
  });
});

describe("renderSpotifyPlaylistResult", () => {
  it("shows success for create", () => {
    const result = renderSpotifyPlaylistResult(
      { content: [{ type: "text", text: "## Spotify Playlist Created ✓" }], details: { action: "create" } },
      { expanded: false, isPartial: false },
      theme
    );
    assert.ok(getText(result).includes("✓"));
    assert.ok(getText(result).includes("Playlist Created"));
  });

  it("shows loading state for add-tracks", () => {
    const result = renderSpotifyPlaylistResult(
      { content: [], details: { action: "add-tracks" } },
      { expanded: false, isPartial: true },
      theme,
    );
    assert.ok(getText(result).includes("Adding Spotify tracks"));
  });
});
