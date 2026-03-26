# Roadmap: pi-apple-music

## Overview
A Pi extension that uses an LLM agent to generate personalized Apple Music playlists by analyzing the user's library and natural language input.

## Current Milestone
**v0.2 Smart Playlists & Polish** (v0.2.0)
Status: 🚧 In Progress
Phases: 0 of 4 complete

## Phases

| Phase | Name | Plans | Status | Completed |
|-------|------|-------|--------|-----------|
| 4 | Library Caching | TBD | Not started | - |
| 5 | Playlist Management | TBD | Not started | - |
| 6 | Smart Playlist Generation | TBD | Not started | - |
| 7 | TUI Polish | TBD | Not started | - |

## Phase Details

### Phase 4: Library Caching
Cache layer for library data with TTL-based expiration. Persist between tool calls to avoid re-fetching on every request. Support manual cache invalidation via command.

### Phase 5: Playlist Management
Add tracks to existing playlists. List and select from existing playlists. Extend the playlist tool beyond create-only.

### Phase 6: Smart Playlist Generation
Genre and mood analysis from library data. Deduplication of tracks already in library. Better LLM context for more relevant playlist recommendations.

### Phase 7: TUI Polish
Custom renderCall and renderResult for all tools. Nicer display of search results, library data, and playlist confirmations in the Pi TUI.

## Completed Milestones

<details>
<summary>v0.1 Initial Release - 2026-03-26 (3 phases)</summary>

| Phase | Name | Plans | Completed |
|-------|------|-------|-----------|
| 1 | Foundation — Scaffold & Apple Music Auth | 01 | 2026-03-26 |
| 2 | Library Reading & LLM Analysis | 01 | 2026-03-26 |
| 3 | Playlist Generation & Creation | 01 | 2026-03-26 |

</details>

---
*Roadmap updated: 2026-03-26 — v0.2 milestone created*
