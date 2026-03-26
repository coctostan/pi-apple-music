# Project: pi-apple-music

## Description
A Pi extension that uses an LLM agent to generate personalized Apple Music playlists. It analyzes the user's current Apple Music library — genres, top artists, recent plays — and combines that with natural language input to create or extend playlists via the Apple Music API.

## Core Value
AI-powered playlist generation from your Apple Music library, directly within Pi.

## Current State
| Attribute | Value |
|-----------|-------|
| Version | 0.2.0 |
| Status | MVP+ |
| Last Updated | 2026-03-26 |

**Current system summary:**
- Working Pi extension with 3 tools, custom TUI rendering, and 1 command
- Apple Music API auth via ES256 JWT developer tokens
- Library reading with in-memory caching (5-min TTL)
- Genre breakdown and top-artist analysis
- Catalog search for finding new songs
- Playlist creation with deduplication + add-tracks-to-existing
- Custom renderCall/renderResult for polished TUI output

## Scope Snapshot
### Validated
- [x] Connect to Apple Music API (developer + user token auth) — v0.1
- [x] Read user's library (songs, artists, albums, playlists) — v0.1
- [x] Search Apple Music catalog — v0.1
- [x] Create playlists via API — v0.1
- [x] Library data caching with TTL — v0.2
- [x] Add tracks to existing playlists — v0.2
- [x] Genre/artist analysis for smarter recommendations — v0.2
- [x] Custom TUI rendering — v0.2

### Active
- [ ] Automated music user token auth flow
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] npm publishing

### Planned
- To be refined in next milestone

### Out of Scope
- None explicitly yet

## Target Users
**Primary:** The developer/owner — wants AI-assisted playlist generation from their personal Apple Music library

## Constraints
- Requires Apple Developer account with MusicKit key
- Music user token must be manually provisioned (valid 180 days)

## Success Metrics
- ✓ Extension authenticates with Apple Music API
- ✓ Extension reads and analyzes the user's library data
- ✓ Extension creates playlists based on LLM recommendations
- ✓ Extension adds tracks to existing playlists
- ✓ Library data is cached to avoid redundant API calls
- ✓ Tool output is polished with custom TUI rendering

## Key Decisions
| Decision | Rationale | Date | Status |
|----------|-----------|------|--------|
| Use pi-extension-template as scaffold | Tested structure, CI, TypeScript, Pi patterns | 2026-03-26 | Active |
| jsonwebtoken for ES256 JWT signing | Cleaner than outdated alternatives | 2026-03-26 | Active |
| Config at ~/.pi-apple-music/config.json | Never store credentials in project dir | 2026-03-26 | Active |
| Manual music user token provisioning | Automated flow deferred | 2026-03-26 | Active |
| LLM-readable markdown output | All tool output for direct LLM consumption | 2026-03-26 | Active |
| In-memory cache, no disk persistence | Session-scoped, simplicity over persistence | 2026-03-26 | Active |
| Single playlist tool with action param | create + add-tracks in one tool | 2026-03-26 | Active |
| Best-effort dedup (200-song sample) | Informational only, not blocking | 2026-03-26 | Active |

## Links
- `PRD.md` — deeper product-definition context
- `.paul/ROADMAP.md` — milestone and phase structure
- `.paul/MILESTONES.md` — completed milestone log

---
*Last updated: 2026-03-26 after v0.2 Smart Playlists & Polish*
