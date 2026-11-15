# SONORA — Listening Room

A dark, glassy music discovery interface built around a simple idea: finding something good should feel as good as listening to it.

SONORA pairs a spatial listening-room layout with live catalogue search, short audio previews and a lightweight player. The interface is intentionally closer to a music dashboard than a conventional streaming-service clone.

## Preview

![SONORA interface preview](./assets/preview.svg)

## What works

- Search the Apple iTunes music catalogue by artist, song or album
- Play and pause short audio preview clips
- Skip through the current results
- Shuffle and repeat playback
- Adjust volume and scrub through a preview
- Like tracks and keep them in local storage
- Browse mood shortcuts for indie, chill, pop and focus searches
- Open the matching Apple Music listing for the full track
- Responsive layout for desktop and mobile

## Stack

- HTML, CSS and vanilla JavaScript
- Apple iTunes Search API for catalogue metadata and preview URLs
- HTMLAudioElement for preview playback
- localStorage for liked tracks
- Vercel static hosting

No API key is required for the iTunes Search endpoint. Preview availability depends on the track and region. SONORA does not host or download music.

## Run locally

This is a static project, so there is no build step.

```bash
git clone https://github.com/ansh44233/sonora-listening-room.git
cd sonora-listening-room
python -m http.server 4173
```

Open http://localhost:4173.

## Deploy to Vercel

1. Import this GitHub repository in https://vercel.com/new.
2. Keep the framework preset as **Other**.
3. Leave the build command empty.
4. Deploy the static site.

## Project structure

```text
sonora-listening-room/
├── assets/
│   └── preview.svg
├── app.js
├── index.html
├── styles.css
├── vercel.json
├── LICENSE
└── README.md
```

## Notes

- Preview clips are short samples supplied by Apple's catalogue, not full-length streams.
- Search results and preview availability are controlled by the external catalogue.
- Liked tracks are stored in the current browser only; they are not synced between devices.
- Album artwork is loaded from the catalogue.

## License

MIT — see [LICENSE](./LICENSE).
