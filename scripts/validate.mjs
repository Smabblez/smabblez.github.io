import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { runInNewContext } from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const read = (file) => readFileSync(join(root, file), 'utf8');
const index = read('index.html');
const styles = read('styles.css');
const configSource = read('site.config.js');
const sandbox = { window: {} };
runInNewContext(configSource, sandbox, { filename: 'site.config.js' });
const config = sandbox.window.SMABBLEZ_SITE;
const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };

check(config?.socials?.twitch === 'https://www.twitch.tv/smabblez', 'Twitch must use /smabblez.');
check(config?.socials?.tiktok === 'https://www.tiktok.com/@Smabblez', 'TikTok must use @Smabblez.');
check(config?.socials?.discord === 'https://discord.gg/5edKN6cw2K', 'Discord invite is incorrect.');
check(config?.socials?.spotify === 'https://open.spotify.com/artist/1JiqQUYL0EA1h3jVQIRQtg', 'Spotify artist URL is incorrect.');
check((index.match(/data-social="spotify"/g) || []).length >= 3, 'Spotify must be visible in the feature, finale, and footer.');
check(!/twitch\.tv\/smabbles\b/i.test(index + configSource), 'Legacy Twitch handle found.');
check(!/tiktok\.com\/@smabbles\b/i.test(index + configSource), 'Legacy TikTok handle found.');
check(!/\bclips?\b/i.test(index), 'Public page still contains clip-related copy or UI.');
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
  console.log(`Validation passed: ${assetRefs.length} local assets, correct social handles, GitHub Pages-safe paths, finished social funnel.`);
}
