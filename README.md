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
node scripts/generate-sitemap.mjs --check
```

No package installation or build step is required.

## GitHub Pages

Production deploys automatically from the `main` branch through `.github/workflows/deploy.yml`.

Live site: `https://smabblez.github.io/`

All styles, scripts, images, and section links use relative paths, and the production site is published from the `smabblez.github.io` user-site repository root.

Search metadata is kept directly in the HTML so crawlers and social preview bots can read it without JavaScript. `robots.txt` advertises `sitemap.xml`; both files are copied by the Pages workflow. See `SEO_LAUNCH.md` for the one-time Google Search Console steps.

The sitemap is generated from the reviewed `seo.indexablePages` allowlist in `site.config.js`. Run `node scripts/generate-sitemap.mjs` after adding a public page; validation and the Pages workflow fail if `sitemap.xml` is stale.

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

Tracked calls to action on the homepage and secondary public pages emit a browser event named `smabblez:conversion`. To collect those events, set `analytics.endpoint` in `site.config.js` to a POST endpoint you control. The payload contains the event label, destination origin/path, page path, timestamp, an allowlisted UTM attribution object, and the referring page's origin only. It does not set cookies, use local storage, capture a full referrer URL, or create a user identifier. With no endpoint configured, nothing is transmitted.

The standalone `about.html` page is the crawlable creator overview, `gta-rp.html` is the focused roleplay content page, `music.html` is the crawlable Spotify track list, and `media-kit.html` is the public collaboration one-sheet with a print/save-PDF layout. They intentionally use only verified public claims and links.
