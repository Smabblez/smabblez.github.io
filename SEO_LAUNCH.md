# Google Search launch checklist

The site already includes crawlable titles and descriptions, canonical URLs, `ProfilePage` structured data, social preview metadata, a stable favicon, `robots.txt`, and `sitemap.xml`.

## After the SEO changes are deployed

1. Open [Google Search Console](https://search.google.com/search-console/).
2. Add a **URL-prefix property** for `https://smabblez.github.io/`. A Domain property is not appropriate because GitHub, not Smabblez, controls the `github.io` DNS zone.
3. Choose **HTML tag** verification. Paste Google's exact verification `<meta>` tag in the `<head>` of `index.html`, deploy it, then click **Verify**. Do not commit a made-up or placeholder token.
4. In **Sitemaps**, submit `https://smabblez.github.io/sitemap.xml`.
5. Use **URL Inspection** on both canonical pages and request indexing:
   - `https://smabblez.github.io/`
   - `https://smabblez.github.io/media-kit.html`
6. Run Google's **Rich Results Test** on the homepage and confirm the `ProfilePage` entity is readable.
7. Check Search Console after major content changes and about once a month. Watch queries, impressions, clicks, indexing errors, and mobile usability.

## Social profile consistency

Use the same display name, profile image, short creator description, and website URL on Twitch, TikTok, YouTube, Spotify, and Discord. Link each public profile back to `https://smabblez.github.io/` when the platform allows it. The website already links back to the official profiles, creating a consistent identity trail for people and crawlers.

## What not to do

- Do not stuff hidden keywords or repeat platform names unnaturally.
- Do not buy backlinks or use automated link schemes.
- Do not add follower counts unless they are verified and maintained.
- Do not change canonical URLs, the favicon path, or social handles casually.
