import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = (file) => readFileSync(join(root, file), 'utf8');
const configSandbox = { window: {} };
runInNewContext(read('site.config.js'), configSandbox, { filename: 'site.config.js' });
const config = configSandbox.window.SMABBLEZ_SITE;
const pages = config?.seo?.indexablePages;
const siteUrl = String(config?.siteUrl || '').replace(/\/$/, '');
const checkOnly = process.argv.includes('--check');

if (!siteUrl || !Array.isArray(pages) || pages.length === 0) {
  throw new Error('site.config.js must define siteUrl and seo.indexablePages.');
}

const canonicalPages = pages.map((page) => {
  if (typeof page !== 'string' || !/^[-\w]+\.html$/.test(page)) {
    throw new Error(`Invalid indexable page: ${page}`);
  }
  const source = join(root, page);
  if (!existsSync(source)) throw new Error(`Indexable page is missing: ${page}`);
  const html = read(page);
  const canonical = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i)?.[1];
  if (!canonical || !canonical.startsWith(`${siteUrl}/`)) {
    throw new Error(`Missing or invalid canonical URL in ${page}.`);
  }
  return canonical;
}).sort((a, b) => a.localeCompare(b));

if (new Set(canonicalPages).size !== canonicalPages.length) {
  throw new Error('Indexable pages contain duplicate canonical URLs.');
}

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${canonicalPages.map((url) => `  <url>\n    <loc>${url}</loc>\n  </url>`).join('\n')}\n</urlset>\n`;
const output = read('sitemap.xml');

if (checkOnly) {
  if (output !== sitemap) {
    throw new Error('sitemap.xml is stale. Run `node scripts/generate-sitemap.mjs`.');
  }
  console.log(`Sitemap check passed: ${canonicalPages.length} canonical public pages.`);
} else {
  writeFileSync(join(root, 'sitemap.xml'), sitemap, 'utf8');
  console.log(`Sitemap generated: ${canonicalPages.length} canonical public pages.`);
}
