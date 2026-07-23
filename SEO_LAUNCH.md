# Search launch checklist

The site already includes crawlable titles and descriptions, canonical URLs, page-specific structured data, social preview metadata, a stable favicon, `robots.txt`, and a generated `sitemap.xml` covering five public pages.

## After the SEO changes are deployed

1. Open [Google Search Console](https://search.google.com/search-console/).
2. Add a **URL-prefix property** for `https://smabblez.github.io/`. A Domain property is not appropriate because GitHub, not Smabblez, controls the `github.io` DNS zone.
3. Choose **HTML tag** verification. Paste Google's exact verification `<meta>` tag in the `<head>` of `index.html`, deploy it, then click **Verify**. Do not commit a made-up or placeholder token.
4. In **Sitemaps**, submit `https://smabblez.github.io/sitemap.xml`.
5. Use **URL Inspection** on each canonical page and request indexing:
   - `https://smabblez.github.io/`
   - `https://smabblez.github.io/about.html`
   - `https://smabblez.github.io/gta-rp.html`
   - `https://smabblez.github.io/media-kit.html`
   - `https://smabblez.github.io/music.html`
6. Run Google's **Rich Results Test** on the homepage, About page, GTA RP page, and Music page. Confirm each page's structured data is readable; the media kit can be checked as a normal canonical page.
7. Add the same URL-prefix property in [Bing Webmaster Tools](https://www.bing.com/webmasters/), complete one of Bing's owner verification methods, and submit `https://smabblez.github.io/sitemap.xml`.
8. Check Search Console and Bing Webmaster Tools after major content changes and about once a month. Watch queries, impressions, clicks, indexing errors, and mobile usability.

## Social profile consistency

Use the same display name, profile image, short creator description, and website URL on Twitch, TikTok, YouTube, Spotify, and Discord. Link each public profile back to `https://smabblez.github.io/` when the platform allows it. The website already links back to the official profiles, creating a consistent identity trail for people and crawlers.

## What not to do

- Do not stuff hidden keywords or repeat platform names unnaturally.
- Do not buy backlinks or use automated link schemes.
- Do not add follower counts unless they are verified and maintained.
- Do not change canonical URLs, the favicon path, or social handles casually.
