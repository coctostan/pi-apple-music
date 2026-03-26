# Milestones

Completed milestone log for this project.

| Milestone | Completed | Duration | Stats |
|-----------|-----------|----------|-------|
| v0.1 Initial Release | 2026-03-26 | ~1 hour | 3 phases, 3 plans |

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
