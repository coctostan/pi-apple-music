import { describe, it } from "node:test";
import assert from "node:assert/strict";
import piAppleMusic from "../src/index.js";

interface RegisteredCommand {
  name: string;
  options: { description: string };
}

interface RegisteredTool {
  name: string;
  options: { name: string; label: string; description: string };
}

interface RegisteredEvent {
  event: string;
}

function setupMock() {
  const commands: RegisteredCommand[] = [];
  const tools: RegisteredTool[] = [];
  const events: RegisteredEvent[] = [];

  const mockPi = {
    on(event: string, _handler: unknown) {
      events.push({ event });
    },
    registerCommand(name: string, options: { description: string }) {
      commands.push({ name, options });
    },
    registerTool(options: { name: string; label: string; description: string }) {
      tools.push({ name: options.name, options });
    },
  };

  piAppleMusic(mockPi as never);
  return { commands, tools, events };
}

void describe("Spotify extension registration", () => {
  void it("registers the spotify command", () => {
    const { commands } = setupMock();
    const spotifyCmd = commands.find((c) => c.name === "spotify");
    assert.ok(spotifyCmd, "Should register /spotify command");
    assert.ok(spotifyCmd.options.description.includes("Spotify"), "Description should mention Spotify");
  });

  void it("registers all three Spotify tools", () => {
    const { tools } = setupMock();
    const toolNames = tools.map((t) => t.name);
    assert.ok(toolNames.includes("spotify_library"), "Should register spotify_library tool");
    assert.ok(toolNames.includes("spotify_search"), "Should register spotify_search tool");
    assert.ok(toolNames.includes("spotify_playlist"), "Should register spotify_playlist tool");
  });

  void it("registers both Apple Music and Spotify tools simultaneously", () => {
    const { commands, tools } = setupMock();
    const commandNames = commands.map((c) => c.name);
    const toolNames = tools.map((t) => t.name);

    // Apple Music
    assert.ok(commandNames.includes("apple-music"), "Apple Music command present");
    assert.ok(toolNames.includes("apple_music_library"), "Apple Music library tool present");
    assert.ok(toolNames.includes("apple_music_search"), "Apple Music search tool present");
    assert.ok(toolNames.includes("apple_music_create_playlist"), "Apple Music playlist tool present");

    // Spotify
    assert.ok(commandNames.includes("spotify"), "Spotify command present");
    assert.ok(toolNames.includes("spotify_library"), "Spotify library tool present");
    assert.ok(toolNames.includes("spotify_search"), "Spotify search tool present");
    assert.ok(toolNames.includes("spotify_playlist"), "Spotify playlist tool present");

    // Totals
    assert.equal(commands.length, 2, "Should register exactly 2 commands");
    assert.equal(tools.length, 6, "Should register exactly 6 tools");
  });

  void it("Spotify tools have correct labels", () => {
    const { tools } = setupMock();
    const spotifyLibrary = tools.find((t) => t.name === "spotify_library");
    const spotifySearch = tools.find((t) => t.name === "spotify_search");
    const spotifyPlaylist = tools.find((t) => t.name === "spotify_playlist");

    assert.equal(spotifyLibrary?.options.label, "Spotify Library");
    assert.equal(spotifySearch?.options.label, "Search Spotify");
    assert.equal(spotifyPlaylist?.options.label, "Spotify Playlist");
  });
});
