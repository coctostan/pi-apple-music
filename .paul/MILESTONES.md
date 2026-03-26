# Milestones

Completed milestone log for this project.

| Milestone | Completed | Duration | Stats |
|-----------|-----------|----------|-------|
| v0.1 Initial Release | 2026-03-26 | ~1 hour | 3 phases, 3 plans |
| v0.2 Smart Playlists & Polish | 2026-03-26 | ~1 hour | 4 phases, 4 plans |

---

## ✅ v0.1 Initial Release

**Completed:** 2026-03-26
**Duration:** ~1 hour

### Stats

| Metric | Value |
|--------|-------|
| Phases | 3 |
| Plans | 3 |
| Files changed | 17 |
| Lines of TypeScript | 1,668 |
| Tests | 36 passing |
| Dependencies added | 1 (jsonwebtoken) |
| Vulnerabilities | 0 |

### Key Accomplishments

- Scaffolded Pi extension from pi-extension-template with full TypeScript toolchain (ESLint, Prettier, node:test)
- Implemented Apple Music API authentication with ES256 JWT developer token generation and secure config storage at `~/.pi-apple-music/`
- Built library reading service: fetch songs, artists, albums, playlists, recently played, and library summary — all formatted as LLM-readable markdown
- Created catalog search tool for finding songs by name/artist/keywords with catalog IDs
- Implemented playlist creation via Apple Music API with auto-detection of library vs catalog track IDs
- Registered 3 Pi tools (`apple_music_library`, `apple_music_search`, `apple_music_create_playlist`) and `/apple-music` command
- End-to-end workflow: user asks → LLM reads library → searches catalog → creates playlist

### Key Decisions

| Decision | Rationale | Date |
|----------|-----------|------|
| Use `jsonwebtoken` for ES256 JWT signing | Cleaner than outdated `apple-music-token-node` | 2026-03-26 |
| Config at `~/.pi-apple-music/config.json` | Never store credentials in project dir | 2026-03-26 |
| Manual music user token provisioning | Automated browser flow deferred for simplicity | 2026-03-26 |
| LLM-readable markdown output (not JSON) | All tool output designed for direct LLM consumption | 2026-03-26 |
| Catalog search without music user token | Catalog is public, only developer token needed | 2026-03-26 |

---

## ✅ v0.2 Smart Playlists & Polish

**Completed:** 2026-03-26
**Duration:** ~1 hour

### Stats

| Metric | Value |
|--------|-------|
| Phases | 4 |
| Plans | 4 |
| Files changed | 10 |
| Lines of TypeScript | 2,628 (total) |
| Tests | 73 passing (+37 new) |
| PRs merged | 4 (GitHub Flow) |
| Vulnerabilities | 0 |

### Key Accomplishments

- In-memory library cache with 5-minute TTL and manual invalidation via `/apple-music cache-clear`
- Add tracks to existing playlists via `add-tracks` action with playlist ID support
- Library playlists listing now includes IDs for LLM cross-referencing
- Genre breakdown analysis: ranked genre table with counts and percentages
- Top artists analysis: artists sorted by song count from library
- Duplicate detection on playlist creation: notes tracks already in library
- Song listings include track IDs for cross-referencing
- Custom TUI rendering for all 3 tools: compact headers, expandable results, loading/error/success states
- Rendering logic extracted to dedicated `src/render.ts` module

### Key Decisions

| Decision | Rationale | Date |
|----------|-----------|------|
| In-memory cache only (no disk) | Session-scoped data, simplicity over persistence | 2026-03-26 |
| Single tool with action param for playlists | `create` and `add-tracks` in one tool vs separate tools | 2026-03-26 |
| Best-effort dedup (200-song sample) | Full library scan too expensive, informational only | 2026-03-26 |
| No context param in renderCall/renderResult | Pi API v0.52 uses 2/3-param signatures | 2026-03-26 |

---