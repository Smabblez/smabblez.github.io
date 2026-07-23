import { cpSync, existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { runInNewContext } from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = (file) => readFileSync(join(root, file), 'utf8');
const sandbox = { window: {} };
runInNewContext(read('site.config.js'), sandbox, { filename: 'site.config.js' });
const pages = sandbox.window.SMABBLEZ_SITE?.seo?.indexablePages;
const outputArg = process.argv[2] || '_site';
const output = resolve(root, outputArg);
const rootWithSeparator = root.endsWith('\\') ? root : `${root}\\`;

if (!Array.isArray(pages) || pages.length === 0) throw new Error('No public pages configured in site.config.js.');
if (!output.startsWith(rootWithSeparator) || output === root) throw new Error('Build output must stay inside the site directory.');

const files = [
  ...pages,
  'analytics.js',
  'robots.txt',
  'sitemap.xml',
  'styles.css',
  'script.js',
  'site.config.js',
  '.nojekyll'
];
files.forEach((file) => {
  if (!existsSync(join(root, file))) throw new Error(`Required deployment file is missing: ${file}`);
});

rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });
files.forEach((file) => cpSync(join(root, file), join(output, file)));
cpSync(join(root, 'assets'), join(output, 'assets'), { recursive: true });
console.log(`Static site built: ${pages.length} public pages and ${files.length} root files copied to ${outputArg}.`);
