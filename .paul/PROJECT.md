# Project: pi-apple-music

## Description
A Pi extension that uses an LLM agent to generate personalized Apple Music playlists. It analyzes the user's current Apple Music library and combines that with natural language input to create new playlists via the Apple Music API.

## Core Value
AI-powered playlist generation from your Apple Music library, directly within Pi.

## Current State
| Attribute | Value |
|-----------|-------|
| Version | 0.1.0 |
| Status | MVP |
| Last Updated | 2026-03-26 |

**Current system summary:**
- Working Pi extension with 3 tools and 1 command
- Apple Music API auth via ES256 JWT developer tokens
- Library reading: songs, artists, albums, playlists, recently played, summary
- Catalog search for finding songs by name/artist
- Playlist creation with auto-detection of library vs catalog track IDs

## Scope Snapshot
### Validated
- [x] Connect to Apple Music API (developer token + user token auth) — v0.1
- [x] Read user's Apple Music library (songs, artists, albums, playlists) — v0.1
- [x] Search Apple Music catalog for songs — v0.1
- [x] Create playlists in user's Apple Music account via API — v0.1

### Active
- [ ] Automated music user token auth flow (browser-based)
- [ ] Add tracks to existing playlists
- [ ] Library data caching

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
- ✓ Extension reads the user's library data
- ✓ Extension creates playlists in the user's Apple Music account based on LLM recommendations

## Key Decisions
| Decision | Rationale | Date | Status |
|----------|-----------|------|--------|
| Use pi-extension-template as scaffold | Provides tested structure, CI, TypeScript, and Pi extension patterns | 2026-03-26 | Active |
| Use Apple Music API for library access and playlist creation | Official API with endpoints for library reads and playlist writes | 2026-03-26 | Active |
| jsonwebtoken for ES256 JWT signing | Cleaner than outdated apple-music-token-node | 2026-03-26 | Active |
| Config at ~/.pi-apple-music/config.json | Never store credentials in project directory | 2026-03-26 | Active |
| Manual music user token provisioning | Automated browser flow deferred for simplicity | 2026-03-26 | Active |
| LLM-readable markdown output | All tool output designed for direct LLM consumption, not raw JSON | 2026-03-26 | Active |
| Catalog search without music user token | Catalog endpoints are public, only developer token needed | 2026-03-26 | Active |

## Links
- `PRD.md` — deeper product-definition context
- `.paul/ROADMAP.md` — milestone and phase structure
- `.paul/MILESTONES.md` — completed milestone log

---
*Last updated: 2026-03-26 after v0.1 Initial Release*
