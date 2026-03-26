---
phase: 11-spotify-tui-multi-platform-polish
plan: 01
completed: 2026-03-26T19:40:00Z
duration: ~20 minutes
---

## Objective

Register Spotify tools and /spotify command, add custom TUI rendering, making Spotify a fully functional second platform alongside Apple Music.

## What Was Built

| File | Purpose | Lines |
|------|---------|-------|
| src/spotify/render.ts | 6 TUI render functions for Spotify tools | 164 |
| src/index.ts | Extended with 3 Spotify tools + /spotify command | 700 (+281) |
| test/spotify-render.test.ts | 13 tests for all render functions | 138 |
| test/spotify-extension.test.ts | 4 tests for tool/command registration and coexistence | 97 |
| test/extension.test.ts | Minor assertion update (1→≥1 commands) | ~1 line |

**Total: 761 new/changed lines across 5 files.**

## Acceptance Criteria Results

| AC | Description | Status |
|----|-------------|--------|
| AC-1 | Spotify library tool with 9 actions | ✅ PASS |
| AC-2 | Spotify search tool | ✅ PASS |
| AC-3 | Spotify playlist tool (create + add-tracks) | ✅ PASS |
| AC-4 | /spotify command (status, config, cache-clear, help) | ✅ PASS |
| AC-5 | TUI rendering for all Spotify tools | ✅ PASS |
| AC-6 | Both platforms coexist (2 commands, 6 tools) | ✅ PASS |

## Verification Results

- `npx tsc --noEmit`: ✅ Build successful
- `pnpm test`: ✅ 140 tests pass (123 + 17 new), 0 failures
- 3 Spotify tools + 1 command registered
- Apple Music tools unaffected

## Module Execution Reports

**Pre-apply:** WALT(100) → baseline 123/0 | TODD(50) → PASS
**Post-apply advisory:** IRIS(250) → 0 anti-patterns | RUBY(300) → index.ts 700 lines (advisory: consider splitting)
**Post-apply enforcement:** WALT(100) → 140/140 pass, +17, PASS | DEAN(150) → 0 vulns | TODD(200) → PASS
**Post-unify:** WALT(100) → quality history recorded

## Deviations

- **Minor:** Updated test/extension.test.ts assertion from `commands.length === 1` to `commands.length >= 1` to accommodate the new /spotify command. This is a test adaptation, not a behavior change.

## Key Patterns/Decisions

- **Shared entry point:** Both platforms registered in the same `piAppleMusic` function. index.ts is now ~700 lines. Future improvement: extract platform registrations into separate modules.
- **saveSpotifyConfig callback:** SpotifyClient receives `saveSpotifyConfig` as its save callback, enabling token auto-refresh to persist new tokens automatically.
- **Private playlists by default:** Spotify playlists created as private (`public: false`).
- **Best-effort dedup:** Fetches first 50 saved track URIs for duplicate detection on playlist creation.

## Next

Milestone v0.3 complete — all 4 phases done. Ready for `/paul:milestone` to complete.
