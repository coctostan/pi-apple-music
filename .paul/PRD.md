# Product Requirements: pi-apple-music

## Problem / Opportunity
Music discovery and playlist creation is manual and time-consuming. Users have large Apple Music libraries but lack tools to automatically analyze their listening patterns and generate fresh, personalized playlists. An LLM agent can understand musical preferences from library data and create contextually relevant playlists on demand.

## Why Now
LLM agents are capable of understanding musical preferences, genre relationships, and mood/context signals. Pi's extension system provides the ideal integration point — the user can describe what kind of playlist they want in natural language and have it created directly in their Apple Music account.

## Current State / Existing System Context
New project. No existing code. Will be scaffolded from the pi-extension-template which provides TypeScript, ESLint, Prettier, tests, CI, and Pi extension registration patterns.

## Desired Outcome
A working Pi extension where the user can:
1. Authenticate with their Apple Music account
2. Have the LLM read and analyze their music library
3. Describe a playlist they want (mood, genre, activity, etc.)
4. Have the extension create that playlist in their Apple Music account

## Target Users and Needs
### Primary Users
- The developer/owner
- Wants AI-powered playlist generation without leaving the Pi environment
- Success: can say "make me a chill evening playlist" and get a real playlist created in Apple Music

## Requirements
### Must Have
- Apple Music API authentication (developer token + music user token)
- Read user's Apple Music library (songs, artists, albums, genres)
- LLM-driven playlist generation based on library analysis + user input
- Create playlists in the user's Apple Music account via API

### Should Have / Nice to Have
- To be refined during planning

### Explicitly Deferred
- None captured yet

### Out of Scope
- None explicitly yet

## Constraints & Dependencies
### Constraints
- None captured

### Dependencies / Integrations
- Apple Music API (https://developer.apple.com/documentation/applemusicapi/)
- Apple Developer account (required for developer token generation)
- Pi extension API (`@mariozechner/pi-coding-agent`)
- pi-extension-template scaffold (https://github.com/ayagmar/pi-extension-template)

## Assumptions
- User has an active Apple Music subscription
- User has or can obtain an Apple Developer account for API access
- Apple Music API provides sufficient library data for LLM analysis

## Open Questions
- What authentication flow works best for a Pi extension? (JWT developer token + MusicKit user token)
- How much library data should be fetched for LLM analysis? (all vs. recent vs. top played)
- Should playlist generation use catalog search to find new songs, or only use existing library tracks?

## Recommended Direction
Build as a hybrid Pi extension (command + tool pattern) using the pi-extension-template scaffold. Register tools that the LLM can call to read library data and create playlists, with a slash command for manual triggers. Use Apple Music API's two-token auth system (developer JWT + music user token).

## Supporting References
- `.paul/PROJECT.md` — compact landing brief
- Apple Music API docs: https://developer.apple.com/documentation/applemusicapi/
- Pi extension template: https://github.com/ayagmar/pi-extension-template

---
*Created: 2026-03-26*
