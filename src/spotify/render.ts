import { Text } from "@mariozechner/pi-tui";

interface Theme {
  fg(color: string, text: string): string;
  bold(text: string): string;
}

interface ToolResult {
  content?: { type: string; text?: string }[];
  details?: Record<string, unknown>;
}

interface RenderOptions {
  expanded: boolean;
  isPartial: boolean;
}

function str(val: unknown, fallback = ""): string {
  if (typeof val === "string") return val;
  if (typeof val === "number") return String(val);
  return fallback;
}

function extractText(result: ToolResult): string {
  return (
    result.content
      ?.filter((p) => p.type === "text" && p.text)
      .map((p) => p.text ?? "")
      .join("\n") ?? ""
  );
}

function firstLine(text: string): string {
  const line = text.split("\n").find((l) => l.trim().length > 0);
  return line?.replace(/^#+\s*/, "") ?? "";
}

function hasError(text: string): boolean {
  return text.includes("Error") || text.includes("Failed") || text.includes("not configured");
}

// --- Spotify Library Tool ---

export function renderSpotifyLibraryCall(args: Record<string, unknown>, theme: Theme): Text {
  let content = theme.fg("toolTitle", theme.bold("🎵 Spotify Library "));
  content += theme.fg("muted", str(args["action"]));
  const limit = args["limit"];
  if (typeof limit === "number") {
    content += theme.fg("dim", ` (limit: ${String(limit)})`);
  }
  return new Text(content, 0, 0);
}

export function renderSpotifyLibraryResult(
  result: ToolResult,
  { expanded, isPartial }: RenderOptions,
  theme: Theme
): Text {
  if (isPartial) {
    return new Text(theme.fg("warning", "⏳ Fetching Spotify library data..."), 0, 0);
  }

  const full = extractText(result);
  const summary = firstLine(full);

  if (hasError(full)) {
    return new Text(theme.fg("error", `✗ ${summary}`), 0, 0);
  }

  let content = theme.fg("success", "✓ ") + summary;
  if (expanded) {
    content += "\n" + theme.fg("dim", full);
  }
  return new Text(content, 0, 0);
}

// --- Spotify Search Tool ---

export function renderSpotifySearchCall(args: Record<string, unknown>, theme: Theme): Text {
  let content = theme.fg("toolTitle", theme.bold("🔍 Spotify Search "));
  content += theme.fg("muted", `"${str(args["term"])}"`);
  const limit = args["limit"];
  if (typeof limit === "number") {
    content += theme.fg("dim", ` (limit: ${String(limit)})`);
  }
  return new Text(content, 0, 0);
}

export function renderSpotifySearchResult(
  result: ToolResult,
  { expanded, isPartial }: RenderOptions,
  theme: Theme
): Text {
  if (isPartial) {
    return new Text(theme.fg("warning", "⏳ Searching Spotify catalog..."), 0, 0);
  }

  const full = extractText(result);
  const summary = firstLine(full);

  if (hasError(full)) {
    return new Text(theme.fg("error", `✗ ${summary}`), 0, 0);
  }

  if (full.includes("No tracks found")) {
    return new Text(theme.fg("dim", "○ " + summary), 0, 0);
  }

  let content = theme.fg("success", "✓ ") + summary;
  if (expanded) {
    content += "\n" + theme.fg("dim", full);
  }
  return new Text(content, 0, 0);
}

// --- Spotify Playlist Tool ---

export function renderSpotifyPlaylistCall(args: Record<string, unknown>, theme: Theme): Text {
  const action = str(args["action"], "create");
  const trackUris = Array.isArray(args["trackUris"]) ? args["trackUris"] : [];
  const trackCount = trackUris.length;

  let content: string;
  if (action === "add-tracks") {
    content = theme.fg("toolTitle", theme.bold("➕ Add Spotify tracks "));
    content += theme.fg("muted", `to ${str(args["playlistId"], "playlist")}`);
  } else {
    content = theme.fg("toolTitle", theme.bold("📝 Create Spotify playlist "));
    content += theme.fg("muted", `"${str(args["name"])}"`);
  }

  if (trackCount > 0) {
    content += theme.fg("dim", ` (${String(trackCount)} track${trackCount !== 1 ? "s" : ""})`);
  }

  return new Text(content, 0, 0);
}

export function renderSpotifyPlaylistResult(
  result: ToolResult,
  { expanded, isPartial }: RenderOptions,
  theme: Theme
): Text {
  const action = str(result.details?.["action"], "create");

  if (isPartial) {
    const msg = action === "add-tracks" ? "Adding Spotify tracks..." : "Creating Spotify playlist...";
    return new Text(theme.fg("warning", `⏳ ${msg}`), 0, 0);
  }

  const full = extractText(result);
  const summary = firstLine(full);

  if (hasError(full)) {
    return new Text(theme.fg("error", `✗ ${summary}`), 0, 0);
  }

  let content = theme.fg("success", "✓ ") + summary;
  if (expanded) {
    content += "\n" + theme.fg("dim", full);
  }
  return new Text(content, 0, 0);
}
