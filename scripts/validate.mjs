import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { runInNewContext } from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const read = (file) => readFileSync(join(root, file), 'utf8');
const index = read('index.html');
const styles = read('styles.css');
const mediaKit = read('media-kit.html');
const about = read('about.html');
const clips = read('clips.html');
const music = read('music.html');
const gtaRp = read('gta-rp.html');
const configSource = read('site.config.js');
const scriptSource = read('script.js');
const analyticsFile = read('analytics.js');
const analyticsSource = scriptSource.slice(scriptSource.indexOf('const analyticsEndpoint'));
const sandbox = { window: {} };
runInNewContext(configSource, sandbox, { filename: 'site.config.js' });
const config = sandbox.window.SMABBLEZ_SITE;
const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };
const indexablePages = config?.seo?.indexablePages || [];
const contentHubs = ['about.html', 'clips.html', 'gta-rp.html', 'media-kit.html', 'music.html'];
const pageMetadata = indexablePages.map((page) => {
  const html = read(page);
  const jsonLdBlocks = [...html.matchAll(/<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/gi)].map((match) => match[1].trim());
  let jsonLdValid = jsonLdBlocks.length > 0;
  try {
    jsonLdBlocks.forEach((block) => JSON.parse(block));
  } catch {
    jsonLdValid = false;
  }
  return {
    page,
    title: html.match(/<title>([^<]+)<\/title>/i)?.[1]?.trim(),
    description: html.match(/<meta\s+name="description"\s+content="([^"]+)"/i)?.[1]?.trim(),
    canonical: html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i)?.[1]?.trim(),
    shareReady: ['og:title', 'og:description', 'og:url', 'og:image', 'og:image:width', 'og:image:height', 'twitter:card', 'twitter:title', 'twitter:description', 'twitter:image']
      .every((name) => html.includes(`content="`) && (html.includes(`property="${name}"`) || html.includes(`name="${name}"`))),
    jsonLdValid
  };
});
const duplicateValues = (values) => values.filter((value, index) => value && values.indexOf(value) !== index);
const headingLevels = (html) => [...html.matchAll(/<h([1-6])\b[^>]*>/gi)].map((match) => Number(match[1]));
const imagesHaveAlt = (html) => [...html.matchAll(/<img\b[^>]*>/gi)].every(([tag]) => /\salt="[^"]*"/i.test(tag));
const blankTargetsHaveRel = (html) => [...html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/gi)].every(([tag]) => /\srel="[^"]*(?:noreferrer|noopener)[^"]*"/i.test(tag));
const pageIds = Object.fromEntries(indexablePages.map((page) => [page, new Set([...read(page).matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]))]));
const checkInternalFragments = () => {
  indexablePages.forEach((page) => {
    const html = read(page);
    [...html.matchAll(/\bhref="([^"]+)"/g)].forEach(([, href]) => {
      if (/^(?:[a-z]+:|\/\/)/i.test(href) || !href.includes('#')) return;
      const [path, fragment] = href.split('#');
      const targetPage = path || page;
      if (!indexablePages.includes(targetPage)) return;
      check(Boolean(fragment) && pageIds[targetPage]?.has(fragment), `Missing internal fragment target: ${page} -> ${href}`);
    });
  });
};
checkInternalFragments();

check(config?.socials?.twitch === 'https://www.twitch.tv/smabblez', 'Twitch must use /smabblez.');
check(config?.socials?.tiktok === 'https://www.tiktok.com/@Smabblez', 'TikTok must use @Smabblez.');
check(config?.socials?.discord === 'https://discord.gg/5edKN6cw2K', 'Discord invite is incorrect.');
check(config?.socials?.spotify === 'https://open.spotify.com/artist/1JiqQUYL0EA1h3jVQIRQtg', 'Spotify artist URL is incorrect.');
check(config?.socials?.youtube === 'https://www.youtube.com/@Smabblez', 'YouTube channel URL is incorrect.');
check(config?.music?.spotifyTracks?.length === 5, 'Spotify track list must include the five artist-page tracks.');
check(config?.content?.twitchVideos?.includes('/smabblez/videos'), 'Twitch recent-broadcast URL is missing.');
check(config?.content?.twitchClips === 'https://www.twitch.tv/smabblez/clips?range=all', 'Twitch clips URL is incorrect.');
check(config?.content?.twitchSchedule === 'https://www.twitch.tv/smabblez/schedule', 'Twitch schedule URL is incorrect.');
check(config?.content?.youtubeShorts === 'https://www.youtube.com/@Smabblez/shorts', 'YouTube Shorts URL is incorrect.');
check(index.includes('href="https://www.twitch.tv/smabblez/clips?range=all"') && index.includes('data-content="twitchClips"'), 'Homepage must expose the configured Twitch clips URL.');
check(index.includes('href="https://www.youtube.com/@Smabblez/shorts"') && index.includes('data-content="youtubeShorts"'), 'Homepage must expose the configured YouTube Shorts URL.');
check(config?.community?.discordInviteCode === '5edKN6cw2K', 'Discord live-preview invite code is missing.');
check(scriptSource.includes('utm_source') && scriptSource.includes('referrerOrigin') && scriptSource.includes('attribution'), 'Conversion analytics attribution is missing.');
check(!/localStorage|sessionStorage|document\.cookie/.test(analyticsSource), 'Conversion analytics must not add browser storage or cookies.');
check(analyticsFile.includes('outbound_click') && analyticsFile.includes('utm_source') && analyticsFile.includes('referrerOrigin'), 'Secondary-page analytics listener is incomplete.');
check(!/localStorage|sessionStorage|document\.cookie/.test(analyticsFile), 'Secondary-page analytics must not use browser storage or cookies.');
check(contentHubs.every((page) => read(page).includes('analytics.js')), 'Every secondary public page must load analytics.js.');
check(existsSync(join(root, 'scripts', 'build-site.mjs')), 'Static deployment builder is missing.');
check(readFileSync(join(root, '.github', 'workflows', 'deploy.yml'), 'utf8').includes('node scripts/build-site.mjs _site'), 'Pages workflow must use the static deployment builder.');
check(indexablePages.length > 0 && pageMetadata.every(({ title, description, canonical }) => title && description && canonical), 'Every configured public page must have a title, description, and canonical URL.');
check(duplicateValues(pageMetadata.map(({ title }) => title)).length === 0, 'Public page titles must be unique.');
check(duplicateValues(pageMetadata.map(({ description }) => description)).length === 0, 'Public page descriptions must be unique.');
check(duplicateValues(pageMetadata.map(({ canonical }) => canonical)).length === 0, 'Public page canonical URLs must be unique.');
check(pageMetadata.every(({ shareReady }) => shareReady), 'Every public page must include complete Open Graph and X/Twitter metadata.');
check(pageMetadata.every(({ jsonLdValid }) => jsonLdValid), 'Every public page must contain parseable JSON-LD structured data.');
check(contentHubs.every((page) => read(page).includes('"@type": "BreadcrumbList"') && read(page).includes('"itemListElement"')), 'Every secondary public page must expose breadcrumb structured data.');
check(indexablePages.every((page) => read(page).includes('<meta name="referrer" content="strict-origin-when-cross-origin">')), 'Every public page must declare the privacy-safe referrer policy.');
check(indexablePages.every((page) => read(page).includes('<link rel="preload" as="font" href="assets/fonts/bungee-latin.woff2" type="font/woff2" crossorigin>')), 'Every public page must preload the shared display font.');
check(indexablePages.every((page) => { const levels = headingLevels(read(page)); return levels.filter((level) => level === 1).length === 1 && levels[0] === 1 && levels.every((level, index) => index === 0 || level <= levels[index - 1] + 1); }), 'Every public page must have one H1 and no skipped heading levels.');
check(indexablePages.every((page) => imagesHaveAlt(read(page))), 'Every public-page image must declare an alt attribute, including an explicit empty value for decoration.');
check(indexablePages.every((page) => blankTargetsHaveRel(read(page))), 'Every target-blank link must include noreferrer or noopener protection.');
check(index.includes('<title>Smabblez | Interactive Twitch Streamer & GTA RP Creator</title>'), 'Homepage SEO title is missing.');
check(index.includes('<link rel="canonical" href="https://smabblez.github.io/">'), 'Homepage canonical URL is missing.');
check(index.includes('"@type": "ProfilePage"') && index.includes('"mainEntity"'), 'Homepage ProfilePage structured data is missing.');
check(index.includes('"@type": "FAQPage"') && index.includes('What does Smabblez stream?'), 'Homepage FAQ structured data is missing.');
check(index.includes('https://www.tiktok.com/@Smabblez') && index.includes('https://www.twitch.tv/smabblez'), 'Structured social identity is incomplete.');
check(index.includes('name="twitter:image"') && index.includes('property="og:image"'), 'Homepage social preview metadata is incomplete.');
check(mediaKit.includes('<link rel="canonical" href="https://smabblez.github.io/media-kit.html">'), 'Media-kit canonical URL is missing.');
check(mediaKit.includes('class="kit-brief"') && (mediaKit.match(/class="kit-brief"/g) || []).length === 1, 'Media-kit collaboration brief checklist is missing.');
check(mediaKit.includes('data-print-kit') && mediaKit.includes('src="media-kit.js?v=20260723a"') && !mediaKit.includes('onclick="window.print()"'), 'Media-kit print control must use the dedicated accessible script.');
check(mediaKit.includes('href="#kit-contact"') && mediaKit.includes('id="kit-contact"'), 'Media-kit must expose an above-the-fold path to collaboration contact.');
check(mediaKit.includes('https://www.twitch.tv/smabblez/clips?range=all') && mediaKit.includes('https://www.youtube.com/@Smabblez/shorts'), 'Media-kit official channels must include verified clip destinations.');
check(existsSync(join(root, 'media-kit.js')) && readFileSync(join(root, 'scripts', 'build-site.mjs'), 'utf8').includes("'media-kit.js'"), 'Media-kit behavior script must be included in the deployment artifact.');
check(about.includes('<title>About Smabblez | Interactive Twitch Streamer & GTA RP Creator</title>'), 'About-page SEO title is missing.');
check(about.includes('<link rel="canonical" href="https://smabblez.github.io/about.html">') && about.includes('id="about-page-title"'), 'About-page canonical URL or H1 is missing.');
check(about.includes('"@type": "AboutPage"') && about.includes('https://www.twitch.tv/smabblez'), 'About-page structured identity is incomplete.');
check(about.includes('href="gta-rp.html"') && about.includes('href="music.html"'), 'About page must link to the dedicated GTA RP and music pages.');
check(contentHubs.every((sourcePage) => contentHubs.every((targetPage) => read(sourcePage).includes(`href="${targetPage}"`))), 'Every public content page must link to the complete content hub set.');
check([about, clips, gtaRp, music].every((html) => html.includes('href="media-kit.html" data-track="media-kit"')), 'Secondary-page collaboration links must emit the media-kit conversion label.');
check(music.includes('<title>Smabblez Music | The Big Top Soundtrack</title>'), 'Music-page SEO title is missing.');
check(music.includes('<link rel="canonical" href="https://smabblez.github.io/music.html">') && music.includes('id="music-title"'), 'Music-page canonical URL or H1 is missing.');
check(music.includes('"@type": "MusicPlaylist"') && (music.match(/open\.spotify\.com\/track\//g) || []).length >= 10, 'Music-page track data is incomplete.');
check(gtaRp.includes('<title>Smabblez GTA RP | Character-Led Interactive Roleplay</title>'), 'GTA RP page SEO title is missing.');
check(gtaRp.includes('<link rel="canonical" href="https://smabblez.github.io/gta-rp.html">') && gtaRp.includes('id="rp-title"'), 'GTA RP page canonical URL or H1 is missing.');
check(gtaRp.includes('"@type": "Article"') && gtaRp.includes('GTA RP streams'), 'GTA RP page structured content is incomplete.');
check(clips.includes('<title>Smabblez Clips | Twitch Clips, YouTube Shorts & TikTok</title>'), 'Clips-page SEO title is missing.');
check(clips.includes('<link rel="canonical" href="https://smabblez.github.io/clips.html">') && clips.includes('id="clips-title"'), 'Clips-page canonical URL or H1 is missing.');
check(clips.includes('"@type": "CollectionPage"') && clips.includes('"@type": "ItemList"') && clips.includes('https://www.twitch.tv/smabblez/clips?range=all'), 'Clips-page structured content is incomplete.');
check(about.includes('href="about.html" aria-current="page"') && clips.includes('href="clips.html" aria-current="page"') && gtaRp.includes('href="gta-rp.html" aria-current="page"') && music.includes('href="music.html" aria-current="page"'), 'Public content navigation must identify the current page.');
check(mediaKit.includes('href="media-kit.html" aria-current="page"'), 'Media-kit navigation must identify the current page.');
check(existsSync(join(root, 'assets', 'favicon.svg')), 'Stable favicon file is missing.');
check(existsSync(join(root, 'robots.txt')), 'robots.txt is missing.');
check(existsSync(join(root, 'sitemap.xml')), 'sitemap.xml is missing.');
check(read('robots.txt').includes('Sitemap: https://smabblez.github.io/sitemap.xml'), 'robots.txt must advertise the sitemap.');
const sitemap = read('sitemap.xml');
const seoLaunch = read('SEO_LAUNCH.md');
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
const expectedSitemapUrls = (config.seo?.indexablePages || []).map((page) => {
  const html = read(page);
  return html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i)?.[1];
}).sort();
check(sitemapUrls.length === expectedSitemapUrls.length && sitemapUrls.slice().sort().every((url, index) => url === expectedSitemapUrls[index]), 'Sitemap must exactly match configured canonical public pages.');
check(expectedSitemapUrls.every((url) => seoLaunch.includes(url)), 'SEO launch checklist must list every canonical public page.');
check(!index.includes('${manifest.'), 'Unresolved manifest placeholders are visible in the homepage.');
check((index.match(/data-social="spotify"/g) || []).length >= 3, 'Spotify must be visible in the feature, finale, and footer.');
check(!/twitch\.tv\/smabbles\b/i.test(index + configSource), 'Legacy Twitch handle found.');
check(!/tiktok\.com\/@smabbles\b/i.test(index + configSource), 'Legacy TikTok handle found.');
check(index.includes('data-twitch-player'), 'Official Twitch live player is missing.');
check(index.includes('class="live-player-fallback"') && index.includes('Open Smabblez on Twitch'), 'Twitch player fallback link is missing.');
check(index.includes('id="follow"'), 'Simplified follow section is missing.');
check(index.includes('id="faq"') && (index.match(/<details>/g) || []).length === 4, 'Homepage FAQ content is missing or incomplete.');
check((index.match(/<section\b/g) || []).length === 4, 'Homepage must stay focused at exactly four sections.');
check(!/id="latest"|id="content"|class="finale"|data-follow-dock/i.test(index), 'Redundant homepage section was reintroduced.');
check(index.includes('class="cursor-nose"'), 'Nose cursor is missing.');
check(index.includes('data-honk') && !index.includes('data-chaos-toggle'), 'Chaos Mode must be merged into the hero nose control.');
check(index.includes('data-sound-restore'), 'Persistent soundtrack restore control is missing.');
check(index.includes('data-discord-preview'), 'Live Discord community preview is missing.');
check(index.includes('href="media-kit.html"'), 'Creator media-kit link is missing.');
check(contentHubs.every((page) => index.includes(`href="${page}"`)), 'Homepage must link to every public content page.');
check(!mediaKit.includes('index.html#collab'), 'Media kit contains a stale removed section link.');
check(existsSync(join(root, 'media-kit.html')), 'Standalone media-kit page is missing.');
check((index.match(/loading="lazy"/g) || []).length >= 4, 'Below-fold media must be lazy-loaded.');
check(!/small amount of dignity/i.test(index), 'Removed dignity copy was reintroduced.');
check(!/data-emote-dialog|badge-ladder|drop-grid|emote vault/i.test(index), 'Asset-catalog UI was reintroduced.');
check((index.match(/class="social-card/g) || []).length === 3, 'The social funnel must have exactly three primary cards.');
check(!/(?:src|href)="\/(?!\/)/i.test(index), 'Root-relative paths break GitHub Pages project-subpath hosting.');
check(styles.includes('@media (prefers-reduced-motion:reduce)'), 'Reduced-motion CSS is missing.');

const assetRefs = indexablePages.flatMap((page) => [...read(page).matchAll(/(?:src|href)="(assets\/[^"?#]+)["?#]/g)].map((match) => ({ page, asset: match[1] })));
const cssAssetRefs = [...styles.matchAll(/url\(["']?(assets\/[^"')]+)["']?\)/g)].map((match) => ({ page: 'styles.css', asset: match[1] }));
for (const { page, asset } of [...assetRefs, ...cssAssetRefs]) {
  check(existsSync(join(root, asset)), `Missing asset: ${page} -> ${asset}`);
}

if (failures.length) {
  console.error(`Validation failed (${failures.length}):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log(`Validation passed: ${assetRefs.length + cssAssetRefs.length} local assets, correct social handles, crawlable SEO files, structured profile data, GitHub Pages-safe paths, finished social funnel.`);
}
