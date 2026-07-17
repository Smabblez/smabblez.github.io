import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || '127.0.0.1';
const types = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8'
};

createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, `http://${host}`).pathname);
  const requested = normalize(pathname).replace(/^(\.\.[/\\])+/, '').replace(/^[/\\]+/, '').replaceAll('\\', '/');
  const projectPrefix = 'smabblez-all-in-one';
  const relative = requested === projectPrefix
    ? ''
    : requested.startsWith(`${projectPrefix}/`)
      ? requested.slice(projectPrefix.length + 1)
      : requested;
  let target = join(root, relative || 'index.html');
  if (existsSync(target) && statSync(target).isDirectory()) target = join(target, 'index.html');

  if (!target.startsWith(root) || !existsSync(target) || !statSync(target).isFile()) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not found');
    return;
  }

  response.writeHead(200, {
    'Cache-Control': 'no-store',
    'Content-Type': types[extname(target).toLowerCase()] || 'application/octet-stream'
  });
  createReadStream(target).pipe(response);
}).listen(port, host, () => {
  console.log(`Smabblez site: http://${host}:${port}/`);
});
