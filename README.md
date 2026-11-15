<div align="center">

  <img src="assets/preview.svg" alt="SONORA listening room artwork" width="100%" />

  <h1>SONORA</h1>
  <p><strong>A listening room for discovering the next track.</strong></p>
  <p>Search YouTube's embeddable music videos and play them in the official YouTube player, inside a focused music-library interface.</p>
  <p><img src="https://img.shields.io/badge/JavaScript-vanilla-f0d66b?style=flat-square&logo=javascript&logoColor=171717" alt="JavaScript"> <img src="https://img.shields.io/badge/Node.js-serverless-43853d?style=flat-square&logo=node.js&logoColor=white" alt="Node.js"> <img src="https://img.shields.io/badge/API-YouTube%20Data%20API%20v3-red?style=flat-square&logo=youtube&logoColor=white" alt="YouTube API"> <img src="https://img.shields.io/badge/Player-YouTube%20IFrame%20API-red?style=flat-square&logo=youtube&logoColor=white" alt="YouTube Player"> <img src="https://img.shields.io/badge/Deploy-Vercel-black?style=flat-square&logo=vercel" alt="Vercel"></p>
</div>

---

## The product

SONORA brings music discovery, a personal library and playback into one listening room. Search is powered by the YouTube Data API v3. Playback uses the official YouTube IFrame Player API, allowing eligible videos to play in full through YouTube's embedded player.

**No audio extraction, stream proxying, ad removal or playback restriction bypassing.** YouTube's player, controls and content policies remain in charge.

## Features

- YouTube video search through a server-side API route.
- Full-length playback for videos that permit embedding and are available in the user's region.
- Official YouTube player controls and branding.
- Play, pause, seek, volume, next, previous, shuffle and repeat.
- Liked tracks and recently played library saved in browser storage.
- Mood-based discovery for indie, chill, pop and focus.
- Queue preview and responsive listening-room layout.
- API key kept in Vercel environment variables, not browser JavaScript.
- Strict SafeSearch and embeddable-video filtering.

## Playback availability

Not every result can play in an embed. Video owners can disable embedding, and videos may be region-restricted, private, age-restricted or removed. If a result cannot play, choose another. Playback behavior and ads are controlled by YouTube.

## Architecture

Browser → GET /api/search?q=... → Vercel serverless function → YouTube Data API v3 (search.list + videos.list) → normalized video results → YouTube IFrame Player API → official embedded playback.

## Stack

| Layer | Technology |
|---|---|
| Frontend | HTML, CSS, vanilla JavaScript |
| Search | YouTube Data API v3 |
| Backend | Vercel Node.js function |
| Playback | YouTube IFrame Player API |
| Persistence | Browser localStorage |
| Tests | Node.js built-in test runner |

## Project structure

- api/search.js — server-side YouTube search and metadata
- assets/preview.svg — project artwork
- tests/search.test.js — duration parsing test
- app2.js — current YouTube player and UI state
- app.js — previous Apple preview implementation; not loaded
- index.html — application markup
- styles.css — responsive interface
- package.json — project scripts
- .env.example — required environment variable
- vercel.json — Vercel configuration

## Setup

1. Create a project in Google Cloud Console.
2. Enable **YouTube Data API v3** and create an API key. Restrict the key to this API.
3. Copy .env.example to .env.local and set the variable YOUTUBE_API_KEY to your key.
4. Install Vercel CLI and run:

    npm install
    npx vercel dev

Open the local URL printed by Vercel CLI. Opening the HTML file directly will not run the serverless search route.

## Deployment

1. Import the repository into Vercel.
2. Add YOUTUBE_API_KEY in Project Settings → Environment Variables for Preview and Production.
3. Redeploy after saving the variable.
4. Search for a track and test playback in the official YouTube player.

No frontend build command is required. The /api/search route runs as a Vercel Node.js function.

## Testing

Run 'npm test'. The included unit test checks ISO-8601 video duration parsing. It does not replace browser testing of actual YouTube playback, which depends on each video's embed permissions and availability.

## Current scope

- Search and YouTube embedded playback: implemented in the current frontend/backend code.
- Liked and recently played tracks: persisted locally in this browser.
- Playlist creation and editing: not yet implemented.
- Account login and cross-device sync: not implemented.
- Automated browser playback tests: not yet implemented.

## Limits and configuration

- Search region: India (IN).
- SafeSearch: strict.
- Search results: up to 25 embeddable videos.
- YouTube Data API quota applies; successful search responses are briefly cached.
- Liked and recent items stay in this browser and are not synced to an account.
- A YouTube API key is required for catalogue search.

## Roadmap

- [ ] Playlist creation, rename, delete and reorder.
- [ ] Browser end-to-end tests for search and playback.
- [ ] Improved keyboard and screen-reader support.
- [ ] Recovery flow for removed or blocked videos.
- [ ] Real desktop and mobile screenshots after browser QA.

## License

MIT. YouTube APIs, the embedded player and all video content remain subject to Google's and YouTube's terms and policies.
