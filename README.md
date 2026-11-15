<div align="center">

  <img src="assets/preview.svg" alt="SONORA — Find your sound. Make room for music." width="100%" />

  <h1>SONORA</h1>
  <p><strong>Find your sound. Make room for music.</strong></p>
  <p>A personal music-discovery and listening-room web app — built from scratch with vanilla JavaScript, YouTube's official player, Firebase Authentication and Cloud Firestore.</p>

  <p>
    <a href="https://sonora-listening-room.vercel.app/"><img src="https://img.shields.io/badge/Live%20App-Open%20SONORA-a6d52b?style=for-the-badge&labelColor=171b16" alt="Open live app"></a>
    <a href="https://github.com/ansh44233/sonora-listening-room"><img src="https://img.shields.io/badge/Source-GitHub-ffffff?style=for-the-badge&logo=github&logoColor=181717" alt="GitHub repository"></a>
    <img src="https://img.shields.io/badge/JavaScript-Vanilla-f7df1e?style=for-the-badge&logo=javascript&logoColor=171717" alt="Vanilla JavaScript">
    <img src="https://img.shields.io/badge/Hosted%20on-Vercel-ffffff?style=for-the-badge&logo=vercel&logoColor=000000" alt="Vercel">
  </p>
  <p><sub>Independent portfolio project · Created by <a href="https://github.com/ansh44233">ansh44233</a></sub></p>
</div>

---

## The idea

SONORA is a web-based listening room designed to make music discovery feel calm, focused and personal. It brings search, playback, mood-led discovery and a personal library into one responsive interface.

The product uses YouTube's official embedded player for playback. It does not download, extract or proxy music streams.

**Try it:** [sonora-listening-room.vercel.app](https://sonora-listening-room.vercel.app/) · **Explore the code:** [GitHub repository](https://github.com/ansh44233/sonora-listening-room)

## Product preview

The images below are live captures of the deployed app at desktop and mobile viewport widths. They are generated from the public deployment, so they reflect the current live build rather than hand-edited concept art. If the deployment is sleeping or temporarily unavailable, open the live app directly.

<table>
  <tr>
    <td align="center" width="50%">
      <strong>Desktop experience</strong><br>
      <a href="https://sonora-listening-room.vercel.app/">
        <img src="https://image.thum.io/get/width/1440/crop/1000/noanimate/https://sonora-listening-room.vercel.app/" alt="SONORA desktop live capture" width="100%">
      </a>
    </td>
    <td align="center" width="50%">
      <strong>Mobile experience</strong><br>
      <a href="https://sonora-listening-room.vercel.app/">
        <img src="https://image.thum.io/get/width/390/crop/844/noanimate/https://sonora-listening-room.vercel.app/" alt="SONORA mobile live capture" width="100%">
      </a>
    </td>
  </tr>
</table>

## What you can do

| Area | Experience |
|---|---|
| Discover | Search YouTube music videos and explore mood-based searches |
| Listen | Play, pause, seek, change volume, skip, shuffle and repeat |
| Player | Use the official YouTube embed in a draggable, minimizable player stage |
| Library | Like tracks and revisit recently played music |
| Playlists | Create, rename, open, add tracks to and delete playlists |
| Accounts | Sign in with Google or email/password using Firebase Authentication |
| Profile | Update the account display name and sign out |
| Cloud library | Sync likes, recent tracks and playlists to a user-scoped Firestore document after setup |
| Responsive UI | Desktop layout, compact mobile navigation and mobile player controls |

### Interaction details

- Search is submitted with Enter, avoiding a YouTube API request on every keystroke.
- In-app navigation is designed to keep the YouTube player mounted while changing views.
- The player stage can be dragged, minimized, restored and closed.
- Likes, recent tracks and playlists are stored locally, and can be synchronized to Firestore for signed-in users.
- The account panel includes profile controls and an autoplay-next preference.

> **Playback note:** YouTube video owners control whether a video can be embedded. Private, removed, age-restricted, region-restricted or non-embeddable videos may not play. Browser and operating-system power policies can also affect background playback.

## How it is built

```text
SONORA
├── Frontend
│   ├── index.html          App structure and dialogs
│   ├── styles.css          Responsive visual system
│   ├── app2.js             Search, playback, library and playlists
│   └── auth.js             Authentication and cloud-library sync
│
├── Serverless API
│   └── api/search.js       Server-side YouTube Data API requests
│
├── Firebase
│   ├── Firebase Auth       Google + email/password accounts
│   └── Cloud Firestore     Per-user library document
│
├── tests/
│   └── search.test.js      Node.js API utility and validation tests
│
└── .github/workflows/
    └── ci.yml              Automated test workflow
```

### Technology

| Layer | Tools |
|---|---|
| Frontend | HTML5, CSS3, vanilla JavaScript |
| Music search | YouTube Data API v3 |
| Playback | YouTube IFrame Player API |
| Backend endpoint | Vercel Serverless Functions, Node.js |
| Authentication | Firebase Authentication |
| Cloud data | Cloud Firestore |
| Local persistence | Browser localStorage |
| Tests | Node.js built-in test runner |
| CI | GitHub Actions |
| Deployment | Vercel |

## Run it locally

### Prerequisites

- A currently supported Node.js LTS version
- A Google Cloud project with YouTube Data API v3 enabled
- A Firebase project for account and cloud-library features
- Vercel CLI for running the serverless API locally

### 1. Clone the repository

```bash
git clone https://github.com/ansh44233/sonora-listening-room.git
cd sonora-listening-room
npm install
```

### 2. Configure YouTube search

Create a local environment file from the example:

```bash
cp .env.example .env.local
```

Add your YouTube Data API key:

```env
YOUTUBE_API_KEY=your_youtube_data_api_key
```

Keep this key on the server. Never expose it in frontend JavaScript or commit a real key.

### 3. Configure Firebase

1. Create or open your Firebase project.
2. Add a Firebase Web App and copy its web configuration into `firebase-config.js`.
3. Enable Google and Email/Password providers under **Authentication → Sign-in method**.
4. Add your local and production hostnames under **Authentication → Settings → Authorized domains**.
5. Review your email verification and password-reset settings.

The Firebase web config is intended for browser use. It is not an Admin SDK credential. Never commit service-account JSON or private server keys.

### 4. Enable Cloud Firestore sync

1. Create a **Cloud Firestore** database in the same Firebase project.
2. Use the default database ID unless you have a specific reason not to.
3. In **Firestore → Rules**, publish the rules from `firestore.rules`.
4. Keep the rules restricted to the signed-in user's own UID.

The repository's rules are:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /sonoraLibraries/{userId} {
      allow read, create, update, delete: if request.auth != null
        && request.auth.uid == userId;
    }
  }
}
```

SONORA stores each signed-in user's library at `sonoraLibraries/{uid}`. Signed-out data remains in that browser's local storage. Cloud sync is available only after Firestore is created, the rules are published and Firebase Authentication is configured.

### 5. Start the development server

```bash
npx vercel dev
```

Open the local URL provided by Vercel. Do not open `index.html` directly as a file: the YouTube search endpoint is a serverless route.

## Deploy

1. Import this GitHub repository into Vercel.
2. Add `YOUTUBE_API_KEY` under **Project Settings → Environment Variables**.
3. Confirm the deployed domain is listed in Firebase Authentication's authorized domains.
4. Deploy the `main` branch.
5. Verify search, playback, authentication, Firestore sync and mobile layout on the deployed site.

Vercel is connected to the repository for deployment. A successful Git push does not by itself prove that every third-party integration is configured; complete the verification steps below after deployment.

## Quality checks

Run the automated suite locally:

```bash
npm test
```

The current tests cover YouTube duration parsing, invalid duration handling, HTTP method validation, empty search input and missing API-key handling. GitHub Actions runs the test command on pushes and pull requests targeting `main`.

### Manual release checklist

- [ ] Search returns results with a valid server-side API key.
- [ ] An embeddable video plays in the official YouTube player.
- [ ] Play, pause, seek, volume, next, previous, shuffle and repeat work.
- [ ] Minimize and restore preserve the active player session.
- [ ] Likes, recent tracks and playlists survive a page refresh.
- [ ] Google sign-in works on the deployed authorized domain.
- [ ] Email sign-up, verification, sign-in and password reset work.
- [ ] Firestore sync works after publishing the rules.
- [ ] Two different accounts cannot read or overwrite each other's library.
- [ ] Mobile navigation, search, account dialog and player fit common phone widths.
- [ ] Keyboard navigation and visible focus states are usable.

Automated API tests are not a substitute for browser-level, mobile-device or Firebase security testing. Do not treat unchecked items as verified.

## Project boundaries and privacy

- **Music playback:** Playback is provided by YouTube's official embed. SONORA does not download audio or bypass YouTube restrictions.
- **Third-party availability:** Video availability and embedding permissions are controlled by YouTube and the video owner.
- **API quota:** YouTube Data API searches consume project quota. Search is submitted explicitly rather than on each typed character.
- **Local data:** Signed-out library data is stored in the current browser's local storage.
- **Cloud data:** Signed-in library data is stored in a Firestore document scoped to the Firebase Auth UID and protected by the included rules.
- **Credentials:** Passwords are handled by Firebase Authentication. Keep API keys and private credentials out of source control.

## Roadmap

- [ ] End-to-end browser tests for sign-in, playback and library workflows.
- [ ] Firestore rules emulator tests and stronger document validation.
- [ ] Playlist reordering and sharing.
- [ ] Better search filters and discovery controls.
- [ ] Accessibility audit with keyboard and screen-reader testing.
- [ ] Performance checks on lower-powered mobile devices.
- [ ] More real-device playback testing across browsers.

## Star history

If you find the project interesting, consider giving the repository a star. The chart below tracks public GitHub stars over time; it will update as the repository receives stars.

[![Star History Chart](https://api.star-history.com/svg?repos=ansh44233/sonora-listening-room&type=date&legend=top-left)](https://www.star-history.com/#ansh44233/sonora-listening-room&type=date)

[![GitHub stars](https://img.shields.io/github/stars/ansh44233/sonora-listening-room?style=social)](https://github.com/ansh44233/sonora-listening-room/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/ansh44233/sonora-listening-room?style=social)](https://github.com/ansh44233/sonora-listening-room/network/members)

## Contributing

Ideas, bug reports and pull requests are welcome. For larger changes, open an issue first with the user problem, proposed behavior and how the change can be verified.

## Credits and license

Created as an independent project by [ansh44233](https://github.com/ansh44233).

This repository is distributed under the MIT License. YouTube, Firebase, Vercel and all other third-party products and marks belong to their respective owners and remain subject to their terms and policies. See the [YouTube API Services Terms of Service](https://developers.google.com/youtube/terms/api-services-terms-of-service).
