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
const music = read('music.html');
const gtaRp = read('gta-rp.html');
const configSource = read('site.config.js');
const sandbox = { window: {} };
runInNewContext(configSource, sandbox, { filename: 'site.config.js' });
const config = sandbox.window.SMABBLEZ_SITE;
const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };
const indexablePages = config?.seo?.indexablePages || [];
const pageMetadata = indexablePages.map((page) => {
  const html = read(page);
  return {
    page,
    title: html.match(/<title>([^<]+)<\/title>/i)?.[1]?.trim(),
    description: html.match(/<meta\s+name="description"\s+content="([^"]+)"/i)?.[1]?.trim(),
    canonical: html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i)?.[1]?.trim()
  };
});
const duplicateValues = (values) => values.filter((value, index) => value && values.indexOf(value) !== index);

check(config?.socials?.twitch === 'https://www.twitch.tv/smabblez', 'Twitch must use /smabblez.');
check(config?.socials?.tiktok === 'https://www.tiktok.com/@Smabblez', 'TikTok must use @Smabblez.');
check(config?.socials?.discord === 'https://discord.gg/5edKN6cw2K', 'Discord invite is incorrect.');
check(config?.socials?.spotify === 'https://open.spotify.com/artist/1JiqQUYL0EA1h3jVQIRQtg', 'Spotify artist URL is incorrect.');
check(config?.socials?.youtube === 'https://www.youtube.com/@Smabblez', 'YouTube channel URL is incorrect.');
check(config?.music?.spotifyTracks?.length === 5, 'Spotify track list must include the five artist-page tracks.');
check(config?.content?.twitchVideos?.includes('/smabblez/videos'), 'Twitch recent-broadcast URL is missing.');
check(config?.content?.twitchSchedule === 'https://www.twitch.tv/smabblez/schedule', 'Twitch schedule URL is incorrect.');
check(config?.community?.discordInviteCode === '5edKN6cw2K', 'Discord live-preview invite code is missing.');
check(indexablePages.length > 0 && pageMetadata.every(({ title, description, canonical }) => title && description && canonical), 'Every configured public page must have a title, description, and canonical URL.');
check(duplicateValues(pageMetadata.map(({ title }) => title)).length === 0, 'Public page titles must be unique.');
check(duplicateValues(pageMetadata.map(({ description }) => description)).length === 0, 'Public page descriptions must be unique.');
check(duplicateValues(pageMetadata.map(({ canonical }) => canonical)).length === 0, 'Public page canonical URLs must be unique.');
check(index.includes('<title>Smabblez | Interactive Twitch Streamer & GTA RP Creator</title>'), 'Homepage SEO title is missing.');
check(index.includes('<link rel="canonical" href="https://smabblez.github.io/">'), 'Homepage canonical URL is missing.');
check(index.includes('"@type": "ProfilePage"') && index.includes('"mainEntity"'), 'Homepage ProfilePage structured data is missing.');
check(index.includes('"@type": "FAQPage"') && index.includes('What does Smabblez stream?'), 'Homepage FAQ structured data is missing.');
check(index.includes('https://www.tiktok.com/@Smabblez') && index.includes('https://www.twitch.tv/smabblez'), 'Structured social identity is incomplete.');
check(index.includes('name="twitter:image"') && index.includes('property="og:image"'), 'Homepage social preview metadata is incomplete.');
check(mediaKit.includes('<link rel="canonical" href="https://smabblez.github.io/media-kit.html">'), 'Media-kit canonical URL is missing.');
check(about.includes('<title>About Smabblez | Interactive Twitch Streamer & GTA RP Creator</title>'), 'About-page SEO title is missing.');
check(about.includes('<link rel="canonical" href="https://smabblez.github.io/about.html">') && about.includes('id="about-page-title"'), 'About-page canonical URL or H1 is missing.');
check(about.includes('"@type": "AboutPage"') && about.includes('https://www.twitch.tv/smabblez'), 'About-page structured identity is incomplete.');
check(music.includes('<title>Smabblez Music | The Big Top Soundtrack</title>'), 'Music-page SEO title is missing.');
check(music.includes('<link rel="canonical" href="https://smabblez.github.io/music.html">') && music.includes('id="music-title"'), 'Music-page canonical URL or H1 is missing.');
check(music.includes('"@type": "MusicPlaylist"') && (music.match(/open\.spotify\.com\/track\//g) || []).length >= 10, 'Music-page track data is incomplete.');
check(gtaRp.includes('<title>Smabblez GTA RP | Character-Led Interactive Roleplay</title>'), 'GTA RP page SEO title is missing.');
check(gtaRp.includes('<link rel="canonical" href="https://smabblez.github.io/gta-rp.html">') && gtaRp.includes('id="rp-title"'), 'GTA RP page canonical URL or H1 is missing.');
check(gtaRp.includes('"@type": "Article"') && gtaRp.includes('GTA RP streams'), 'GTA RP page structured content is incomplete.');
check(existsSync(join(root, 'assets', 'favicon.svg')), 'Stable favicon file is missing.');
check(existsSync(join(root, 'robots.txt')), 'robots.txt is missing.');
check(existsSync(join(root, 'sitemap.xml')), 'sitemap.xml is missing.');
check(read('robots.txt').includes('Sitemap: https://smabblez.github.io/sitemap.xml'), 'robots.txt must advertise the sitemap.');
const sitemap = read('sitemap.xml');
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
const expectedSitemapUrls = (config.seo?.indexablePages || []).map((page) => {
  const html = read(page);
  return html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i)?.[1];
}).sort();
check(sitemapUrls.length === expectedSitemapUrls.length && sitemapUrls.slice().sort().every((url, index) => url === expectedSitemapUrls[index]), 'Sitemap must exactly match configured canonical public pages.');
check(!index.includes('${manifest.'), 'Unresolved manifest placeholders are visible in the homepage.');
check((index.match(/data-social="spotify"/g) || []).length >= 3, 'Spotify must be visible in the feature, finale, and footer.');
check(!/twitch\.tv\/smabbles\b/i.test(index + configSource), 'Legacy Twitch handle found.');
check(!/tiktok\.com\/@smabbles\b/i.test(index + configSource), 'Legacy TikTok handle found.');
check(index.includes('data-twitch-player'), 'Official Twitch live player is missing.');
check(index.includes('id="follow"'), 'Simplified follow section is missing.');
check(index.includes('id="faq"') && (index.match(/<details>/g) || []).length === 4, 'Homepage FAQ content is missing or incomplete.');
check((index.match(/<section\b/g) || []).length === 4, 'Homepage must stay focused at exactly four sections.');
check(!/id="latest"|id="content"|class="finale"|data-follow-dock/i.test(index), 'Redundant homepage section was reintroduced.');
check(index.includes('class="cursor-nose"'), 'Nose cursor is missing.');
check(index.includes('data-honk') && !index.includes('data-chaos-toggle'), 'Chaos Mode must be merged into the hero nose control.');
check(index.includes('data-sound-restore'), 'Persistent soundtrack restore control is missing.');
check(index.includes('data-discord-preview'), 'Live Discord community preview is missing.');
check(index.includes('href="media-kit.html"'), 'Creator media-kit link is missing.');
check(existsSync(join(root, 'media-kit.html')), 'Standalone media-kit page is missing.');
check((index.match(/loading="lazy"/g) || []).length >= 4, 'Below-fold media must be lazy-loaded.');
check(!/small amount of dignity/i.test(index), 'Removed dignity copy was reintroduced.');
check(!/data-emote-dialog|badge-ladder|drop-grid|emote vault/i.test(index), 'Asset-catalog UI was reintroduced.');
check((index.match(/class="social-card/g) || []).length === 3, 'The social funnel must have exactly three primary cards.');
check(!/(?:src|href)="\/(?!\/)/i.test(index), 'Root-relative paths break GitHub Pages project-subpath hosting.');
check(styles.includes('@media (prefers-reduced-motion:reduce)'), 'Reduced-motion CSS is missing.');

const assetRefs = [...index.matchAll(/(?:src|href)="(assets\/[^"?#]+)["?#]/g)].map((match) => match[1]);
assetRefs.forEach((asset) => check(existsSync(join(root, asset)), `Missing asset: ${asset}`));

if (failures.length) {
  console.error(`Validation failed (${failures.length}):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log(`Validation passed: ${assetRefs.length} local assets, correct social handles, crawlable SEO files, structured profile data, GitHub Pages-safe paths, finished social funnel.`);
}
