import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  renderLibraryCall,
  renderLibraryResult,
  renderSearchCall,
  renderSearchResult,
  renderPlaylistCall,
  renderPlaylistResult,
} from "../src/render.js";

// Mock theme that returns plain text (no ANSI)
const mockTheme = {
  fg(_color: string, text: string): string {
    return text;
  },
  bold(text: string): string {
    return text;
  },
};

function getText(component: { render(width: number): string[] }): string {
  return component.render(100).join("\n");
}

void describe("renderLibraryCall", () => {
  void it("includes action name", () => {
    const result = renderLibraryCall({ action: "songs", limit: 50 }, mockTheme);
    const text = getText(result);
    assert.ok(text.includes("Library"));
    assert.ok(text.includes("songs"));
  });

  void it("shows limit when provided", () => {
    const result = renderLibraryCall({ action: "genres", limit: 100 }, mockTheme);
    const text = getText(result);
    assert.ok(text.includes("limit: 100"));
  });

  void it("handles missing action gracefully", () => {
    const result = renderLibraryCall({}, mockTheme);
    const text = getText(result);
    assert.ok(text.includes("Library"));
  });
});

void describe("renderLibraryResult", () => {
  void it("shows success with summary", () => {
    const result = renderLibraryResult(
      { content: [{ type: "text", text: "## Library Songs (5 of 150)\n\n1. Song A\n2. Song B" }] },
      { expanded: false, isPartial: false },
      mockTheme
    );
    const text = getText(result);
    assert.ok(text.includes("✓"));
    assert.ok(text.includes("Library Songs (5 of 150)"));
  });

  void it("shows full content when expanded", () => {
    const result = renderLibraryResult(
      { content: [{ type: "text", text: "## Songs\n\n1. Song A\n2. Song B" }] },
      { expanded: true, isPartial: false },
      mockTheme
    );
    const text = getText(result);
    assert.ok(text.includes("Song A"));
    assert.ok(text.includes("Song B"));
  });

  void it("shows error state", () => {
    const result = renderLibraryResult(
      { content: [{ type: "text", text: "## Library Songs\nError fetching songs: 401" }] },
      { expanded: false, isPartial: false },
      mockTheme
    );
    const text = getText(result);
    assert.ok(text.includes("✗"));
  });

  void it("shows loading state when partial", () => {
    const result = renderLibraryResult(
      { content: [] },
      { expanded: false, isPartial: true },
      mockTheme
    );
    const text = getText(result);
    assert.ok(text.includes("Fetching library data"));
  });
});

void describe("renderSearchCall", () => {
  void it("includes search term", () => {
    const result = renderSearchCall({ term: "Fleetwood Mac", limit: 25 }, mockTheme);
    const text = getText(result);
    assert.ok(text.includes("Search"));
    assert.ok(text.includes("Fleetwood Mac"));
  });
});

void describe("renderSearchResult", () => {
  void it("shows result count on success", () => {
    const result = renderSearchResult(
      {
        content: [
          {
            type: "text",
            text: '## Search Results for "test" (3 found)\n\n1. Song A\n2. Song B\n3. Song C',
          },
        ],
      },
      { expanded: false, isPartial: false },
      mockTheme
    );
    const text = getText(result);
    assert.ok(text.includes("✓"));
    assert.ok(text.includes("3 found"));
  });

  void it("shows no results state", () => {
    const result = renderSearchResult(
      {
        content: [{ type: "text", text: '## Search Results\nNo songs found matching "xyz".' }],
      },
      { expanded: false, isPartial: false },
      mockTheme
    );
    const text = getText(result);
    assert.ok(text.includes("○"));
  });
});

void describe("renderPlaylistCall", () => {
  void it("shows create action with name", () => {
    const result = renderPlaylistCall(
      { action: "create", name: "Chill Vibes", trackIds: ["1", "2", "3"] },
      mockTheme
    );
    const text = getText(result);
    assert.ok(text.includes("Create playlist"));
    assert.ok(text.includes("Chill Vibes"));
    assert.ok(text.includes("3 tracks"));
  });

  void it("shows add-tracks action with playlist ID", () => {
    const result = renderPlaylistCall(
      { action: "add-tracks", playlistId: "p.ABC123", trackIds: ["1"] },
      mockTheme
    );
    const text = getText(result);
    assert.ok(text.includes("Add tracks"));
    assert.ok(text.includes("p.ABC123"));
    assert.ok(text.includes("1 track"));
    assert.ok(text.includes("1 track)"), "Single track should not be pluralized");
  });
});

void describe("renderPlaylistResult", () => {
  void it("shows success for create", () => {
    const result = renderPlaylistResult(
      {
        content: [{ type: "text", text: "## Playlist Created ✓\n\n**Name:** My Mix" }],
        details: { action: "create" },
      },
      { expanded: false, isPartial: false },
      mockTheme
    );
    const text = getText(result);
    assert.ok(text.includes("✓"));
    assert.ok(text.includes("Playlist Created"));
  });

  void it("shows success for add-tracks", () => {
    const result = renderPlaylistResult(
      {
        content: [{ type: "text", text: "## Tracks Added ✓\n\n**Tracks added:** 5" }],
        details: { action: "add-tracks" },
      },
      { expanded: false, isPartial: false },
      mockTheme
    );
    const text = getText(result);
    assert.ok(text.includes("✓"));
    assert.ok(text.includes("Tracks Added"));
  });

  void it("shows error state", () => {
    const result = renderPlaylistResult(
      {
        content: [{ type: "text", text: "## Playlist Creation Failed\nError: 403" }],
        details: { action: "create" },
      },
      { expanded: false, isPartial: false },
      mockTheme
    );
    const text = getText(result);
    assert.ok(text.includes("✗"));
  });

  void it("shows loading state for create", () => {
    const result = renderPlaylistResult(
      { content: [], details: { action: "create" } },
      { expanded: false, isPartial: true },
      mockTheme
    );
    const text = getText(result);
    assert.ok(text.includes("Creating playlist"));
  });

  void it("shows loading state for add-tracks", () => {
    const result = renderPlaylistResult(
      { content: [], details: { action: "add-tracks" } },
      { expanded: false, isPartial: true },
      mockTheme
    );
    const text = getText(result);
    assert.ok(text.includes("Adding tracks"));
  });
});
