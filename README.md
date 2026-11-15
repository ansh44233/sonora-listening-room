<div align="center">

  <img src="assets/preview.svg" alt="SONORA — a listening room for music discovery" width="100%" />

  <h1>SONORA</h1>
  <p><strong>Find your sound. Make room for music.</strong></p>
  <p>A responsive music-discovery experience with YouTube-powered search, official embedded playback, personal libraries, playlists and Firebase authentication.</p>

  <p>
    <img src="https://img.shields.io/badge/status-active%20development-a6d52b?style=for-the-badge&labelColor=171b16" alt="Active development">
    <img src="https://img.shields.io/badge/JavaScript-vanilla-f7df1e?style=for-the-badge&logo=javascript&logoColor=171717" alt="JavaScript">
    <img src="https://img.shields.io/badge/Firebase-authentication-ffca28?style=for-the-badge&logo=firebase&logoColor=171717" alt="Firebase">
    <img src="https://img.shields.io/badge/Vercel-deployment-ffffff?style=for-the-badge&logo=vercel&logoColor=000000" alt="Vercel">
  </p>
</div>

---

## Overview

SONORA is a music listening-room web application built around a simple idea: make discovering and playing music feel focused, personal and delightful on both desktop and mobile.

The interface combines a curated-feeling home screen, mood shortcuts, searchable YouTube results, a persistent playback bar, a movable video stage and a personal collection. The project uses the official YouTube embedded player rather than extracting or proxying audio.

**Live experience:** [sonora-listening-room.vercel.app](https://sonora-listening-room.vercel.app/)  
**Source code:** [github.com/ansh44233/sonora-listening-room](https://github.com/ansh44233/sonora-listening-room)

## Product highlights

### Discover
- Search music videos through the YouTube Data API v3.
- Explore quick mood searches for indie, chill, pop and focus.
- View video artwork, channel names and duration metadata.
- Search is submitted on Enter to avoid unnecessary API quota usage.

### Listen
- Play and pause, skip tracks, seek and adjust volume.
- Shuffle and repeat controls.
- Movable YouTube playback stage with minimize, restore and close actions.
- Compact playback bar and responsive mobile layout.
- Official YouTube player controls remain available.

### Your library
- Like and revisit tracks.
- Recently played list.
- Create, rename, open and delete playlists.
- Add search results to playlists.
- Local browser persistence using `localStorage`.

### Your account
- Google sign-in through Firebase Authentication.
- Email/password registration and sign-in.
- Email verification and password-reset email.
- Display-name editing and sign-out.

### Experience details
- Responsive desktop and mobile layouts.
- Mobile bottom navigation and compact player.
- Keyboard shortcuts: `Space` play/pause, `←` / `→` seek by ten seconds, `/` focus search.
- Accessible labels and visible focus states for key controls.

## Screens and interaction model

| Area | Purpose |
|---|---|
| Home | Mood discovery and fresh search results |
| Search | Find videos and select a result |
| Your Library | Liked tracks, recent listening and playlists |
| Player bar | Playback controls and current track |
| Video stage | Official YouTube embed; draggable, minimizable and restorable |
| Account | Sign-in, registration, profile display name and sign-out |

## Architecture

```text
Browser UI
  ├── app2.js
  │    ├── Search and result state
  │    ├── Playback controls / YouTube IFrame Player API
  │    ├── Likes, recent tracks and playlists (localStorage)
  │    └── Responsive player interactions
  │
  ├── auth.js ───────── Firebase Authentication
  │
  └── GET /api/search?q=...
          └── Vercel serverless function
                  └── YouTube Data API v3
```

## Technology

| Layer | Technology |
|---|---|
| UI | HTML5, CSS3, vanilla JavaScript |
| Authentication | Firebase Authentication |
| Music discovery | YouTube Data API v3 |
| Playback | YouTube IFrame Player API |
| Serverless API | Vercel Functions / Node.js |
| Browser persistence | localStorage |
| Tests | Node.js built-in test runner |
| Hosting | Vercel |

## Run locally

### Requirements

- Node.js (use a currently supported LTS release).
- A Google Cloud project with YouTube Data API v3 enabled.
- A Firebase project if you want to test account features.
- Vercel CLI for the local serverless API route.

### 1. Clone

```bash
git clone https://github.com/ansh44233/sonora-listening-room.git
cd sonora-listening-room
npm install
```

### 2. Configure YouTube search

Copy `.env.example` to `.env.local` and add:

```env
YOUTUBE_API_KEY=your_youtube_data_api_key
```

Keep this key server-side. Do not put it in browser JavaScript or commit a real key.

### 3. Configure Firebase Authentication

Update `firebase-config.js` with your Firebase Web App configuration. In Firebase Console:

1. Enable Google and Email/Password providers under Authentication → Sign-in method.
2. Add your local and deployed hostnames under Authentication → Settings → Authorized domains.
3. Review email verification and password-reset templates.
4. Restrict the browser API key to the Firebase APIs and domains used by the project.

Firebase web configuration is client-side configuration, not an Admin SDK credential. Never commit service-account JSON or private keys.

### 4. Start the app

```bash
npx vercel dev
```

Open the local URL shown by Vercel. The API route will not work if you open `index.html` directly as a file.

## Deploy to Vercel

1. Import the GitHub repository into Vercel.
2. Add `YOUTUBE_API_KEY` in Project Settings → Environment Variables.
3. Confirm the Firebase production hostname is in Authorized domains.
4. Deploy the `main` branch.
5. Test search, playback, account flows and mobile layout on the deployed URL.

No frontend bundler is required for the current vanilla-JavaScript app.

## Verification

Run the automated tests:

```bash
npm test
```

The current automated suite covers API utility behavior. It does not replace browser-level checks for Firebase OAuth, YouTube embed permissions, responsive behavior or real playback.

Suggested release checklist:

- [ ] Search returns results with a valid API key.
- [ ] A video that allows embedding plays in the official YouTube player.
- [ ] Minimize and restore keep playback state intact.
- [ ] Like, recent and playlist actions persist after refresh in the same browser.
- [ ] Google sign-in works on the deployed authorized domain.
- [ ] Email registration, verification and password reset work.
- [ ] Mobile navigation, search, player and account modal fit common phone widths.

## Important product boundaries

- **Playback:** SONORA embeds YouTube videos. It does not download, extract, proxy, strip ads from or bypass restrictions on YouTube media.
- **Availability:** A video may be unavailable for embedding, private, region-restricted, age-restricted or removed. The video owner and YouTube determine playback availability.
- **Library sync:** Likes, recent tracks and playlists currently use browser-local storage. They are not synchronized between devices or accounts.
- **Authentication:** Firebase sign-in is implemented separately from library persistence; signing in does not currently cloud-sync the library.
- **Quota:** YouTube Data API requests consume project quota. Search only runs after explicit submission.
- **Privacy:** Do not store passwords or sensitive account data in local storage. Firebase manages authentication credentials.

## Repository map

| Path | Responsibility |
|---|---|
| `index.html` | App structure and dialogs |
| `styles.css` | Desktop, mobile and player styling |
| `app2.js` | Search, playback, library and playlists |
| `auth.js` | Firebase sign-in and profile actions |
| `firebase-config.js` | Firebase Web App config |
| `api/search.js` | Server-side YouTube search |
| `tests/` | Automated tests |
| `assets/` | Brand and preview artwork |
| `vercel.json` | Vercel routing/configuration |

## Roadmap

- [ ] Firebase-backed cloud library and cross-device playlist sync.
- [ ] Automated browser tests for critical user journeys.
- [ ] Playlist reorder and collaborative sharing.
- [ ] Better search filters and recommendation controls.
- [ ] Accessibility audit and performance budget.
- [ ] Production screenshots and release notes.

## Contributing

Issues and pull requests are welcome. For substantial changes, open an issue describing the user problem, proposed behavior and verification steps before submitting a pull request.

## License

MIT. YouTube, Firebase and other third-party services remain subject to their respective terms, branding requirements and policies. See [YouTube API Services Terms](https://developers.google.com/youtube/terms/api-services-terms-of-service).
