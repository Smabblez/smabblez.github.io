# Smabblez Website Agent Instructions

Read this file and `site.config.js` before editing. This project is intentionally compact enough for a 120k-token context window. Do not read unrelated parent-workspace folders or binary asset contents.

## Objective

Grow the Smabblez creator brand. The page should funnel visitors in this order:

1. Follow or watch Smabblez live on Twitch.
2. Follow `@Smabblez` on TikTok for short-form content.
3. Join Discord and become part of the recurring community.

The site promotes Jacob/Smabblez as a streamer, performer, GTA RP creator, and community builder. It is not an emote, badge, download, merchandise, or media-hosting catalog. Every visible section must feel finished; do not add setup instructions, coming-soon panels, empty states, or CMS placeholders to the public page.

The live-show differentiator is audience control: Smabblez uses jumpscares, redeems, alerts, and other chat-triggered interactions to make viewers part of the stream. Keep this prominent in Twitch-facing copy.

## Public identity and links

- Website display name: `Smabblez`
- Twitch channel: `https://www.twitch.tv/smabblez`
- TikTok: `https://www.tiktok.com/@Smabblez`
- Discord: `https://discord.gg/5edKN6cw2K`
- Spotify artist page: `https://open.spotify.com/artist/1JiqQUYL0EA1h3jVQIRQtg`
- YouTube: `https://www.youtube.com/@Smabblez`
- Some old workspace files contain legacy spellings and handles. Never copy them into this website.

`site.config.js` is the source of truth for external URLs, recent-content destinations, and the Spotify track list. Keep fallback URLs in `index.html` synchronized for no-JavaScript visitors.

## Deployment target

- Production hosting is GitHub Pages.
- Keep the site fully static and dependency-free.
- Use Twitch's official channel embed for live/offline state and schedule information; do not add fake status or schedule data.
- Use relative asset and script paths so repository-subpath hosting continues to work.
- Do not introduce server routes, server-only rendering, environment secrets, databases, or runtime API credentials.
- `scripts/serve.mjs` is a local preview tool only.

## Brand rules

- Mood: theatrical, mischievous, premium, internet-native chaos.
- Palette: black, warm white, clown-nose red, acid green, purple, and gold.
- Keep backgrounds crisp. Do not add full-page film grain, blurred cursor glows, fog, or fuzzy texture overlays.
- Maintain purposeful visual density with framed headings, bento layouts, outlined display type, and cropped decorative accents; avoid large unstructured black or solid-color gaps.
- Emote art is decorative accenting only: hero composition, cropped backgrounds, and small stickers.
- Never add an emote grid, badge progression, download area, asset gallery, or copyable emote codes.
- Avoid gore, horror-house styling, generic purple streamer templates, fake metrics, fake schedules, and placeholder contact addresses.
- Keep the joke polished. Do not add degrading or self-defeating copy.

## File map

- `site.config.js` — edit first; public social destinations.
- `index.html` — semantic content and conversion funnel.
- `styles.css` — all responsive styling; no CSS framework.
- `script.js` — navigation, reveals, compact Spotify controls, live Discord counts, conversion events, nose cursor, and Chaos Mode.
- `assets/emotes/` — six original transparent PNGs plus optimized WebP versions used on the page.
- `assets/animated/` — two small decorative GIFs currently used.
- `scripts/validate.mjs` — deterministic project checks.
- `scripts/serve.mjs` — dependency-free local server.

## Required quality gates

After every material change:

1. Run `node scripts/validate.mjs`.
2. Run `node --check script.js`.
3. Serve with `node scripts/serve.mjs`.
4. Check desktop and 390px mobile layouts.
5. Confirm there are no console errors, broken images, or horizontal overflow.
6. Confirm keyboard focus is visible and reduced-motion fallbacks remain intact.

Preserve relative paths so the site remains portable and static-host friendly.
