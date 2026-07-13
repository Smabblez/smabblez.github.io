# Smabblez Creator Hub

A finished, responsive creator website built to turn visitors into Twitch followers, TikTok followers, and Discord community members.

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

Live site: `https://smabblez3223.github.io/smabblez/`

All styles, scripts, images, and section links use relative paths, so the site remains compatible with the `/smabblez/` repository subpath.

Do not add a backend, server-only rendering, environment secrets, or root-relative asset paths. `scripts/serve.mjs` is only a local preview helper and is not needed in production.

## Editing order

1. Edit `site.config.js` for public platform URLs.
2. Edit `index.html` for page copy or section structure.
3. Edit `styles.css` for layout and visual design.
4. Edit `script.js` only for behavior.

For Hermes/E4B from this directory, begin with `AGENTS.md`, then `site.config.js`. From the workspace root, use `..\LLM_START_HERE.md` or the generated `..\llm-context\HERMES_CONTEXT.md`. Do not load binary images into context; filenames and the asset map in `AGENTS.md` are sufficient.

## Current public destinations

- Twitch: `https://www.twitch.tv/smabblez`
- TikTok: `https://www.tiktok.com/@Smabblez`
- Discord: `https://discord.gg/5edKN6cw2K`
- Spotify: intentionally blank until the real public URL is supplied
