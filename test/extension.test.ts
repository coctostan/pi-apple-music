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

void describe("piAppleMusic extension", () => {
  void it("exports a function", () => {
    assert.equal(typeof piAppleMusic, "function");
  });

  void it("registers the apple-music command and all three tools", () => {
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

    // Should register the /apple-music command
    assert.equal(commands.length, 1, "Should register exactly 1 command");
    assert.equal(commands[0]?.name, "apple-music", "Command name should be apple-music");

    // Should register 3 tools
    assert.equal(tools.length, 3, "Should register exactly 3 tools");
    const toolNames = tools.map((t) => t.name);
    assert.ok(toolNames.includes("apple_music_library"), "Should register library tool");
    assert.ok(toolNames.includes("apple_music_create_playlist"), "Should register playlist tool");
    assert.ok(toolNames.includes("apple_music_search"), "Should register search tool");

    // Should register session events
    const eventNames = events.map((e) => e.event);
    assert.ok(eventNames.includes("session_start"), "Should listen for session_start");
    assert.ok(eventNames.includes("session_switch"), "Should listen for session_switch");
  });
});
