# Smabblez Creator Hub

A focused, responsive creator website that leads visitors from the live Twitch show to TikTok and the Discord community without repeated sections or competing calls to action.

## Start here

```powershell
node scripts/serve.mjs
```

Open `http://127.0.0.1:4173/`.

Validate after changes:

```powershell
node scripts/validate.mjs
node --check script.js
```

No package installation or build step is required.

## GitHub Pages

Production deploys automatically from the `main` branch through `.github/workflows/deploy.yml`.

Live site: `https://smabblez.github.io/`

All styles, scripts, images, and section links use relative paths, and the production site is published from the `smabblez.github.io` user-site repository root.

Do not add a backend, server-only rendering, environment secrets, or root-relative asset paths. `scripts/serve.mjs` is only a local preview helper and is not needed in production.

## Editing order

1. Edit `site.config.js` for public platform URLs, Discord preview data, and the optional analytics endpoint.
2. Edit `index.html` for page copy or section structure.
3. Edit `styles.css` for layout and visual design.
4. Edit `script.js` only for behavior.

For Hermes/E4B from this directory, begin with `AGENTS.md`, then `site.config.js`. From the workspace root, use `..\LLM_START_HERE.md` or the generated `..\llm-context\HERMES_CONTEXT.md`. Do not load binary images into context; filenames and the asset map in `AGENTS.md` are sufficient.

## Current public destinations

- Twitch: `https://www.twitch.tv/smabblez`
- TikTok: `https://www.tiktok.com/@Smabblez`
- Discord: `https://discord.gg/5edKN6cw2K`
- Spotify: `https://open.spotify.com/artist/1JiqQUYL0EA1h3jVQIRQtg`
- YouTube: `https://www.youtube.com/@Smabblez`

## Conversion analytics

Tracked calls to action emit a browser event named `smabblez:conversion`. To collect those events, set `analytics.endpoint` in `site.config.js` to a POST endpoint you control. The payload contains only the event label, destination origin/path, page path, and timestamp; it does not set cookies or create a user identifier. With no endpoint configured, nothing is transmitted.

The standalone `media-kit.html` page is the public collaboration one-sheet and includes a print/save-PDF layout. It intentionally uses only verified public claims and links.
