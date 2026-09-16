/**
 * Serveur statique de développement.
 *
 * Web Bluetooth exige un contexte sécurisé : `http://localhost` en fait partie,
 * contrairement à `file://`. C'est aussi la seule façon de charger des modules
 * ES, que le protocole `file://` refuse pour cause de CORS.
 *
 * Ce serveur ne sert QUE le dossier demandé, et refuse toute remontée de
 * chemin : il n'est pas destiné à être exposé.
 */

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
};

/**
 * Résout un chemin d'URL vers un fichier, en refusant toute sortie du dossier.
 *
 * @param {string} baseDir
 * @param {string} urlPath
 * @returns {string|null} chemin absolu, ou null si la requête sort du dossier.
 */
function resolveSafe(baseDir, urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const relative = normalize(decoded).replace(/^(\.\.[/\\])+/, '');
  const target = join(baseDir, relative);
  const base = resolve(baseDir);

  if (target !== base && !target.startsWith(base + sep)) return null;
  return target;
}

/**
 * Démarre le serveur.
 *
 * @param {{ dir?: string, port?: number, host?: string }} [options]
 * @returns {Promise<{ url: string, close: () => Promise<void> }>}
 */
export async function serve(options = {}) {
  const dir = resolve(options.dir ?? join(ROOT, 'dist', 'web'));
  const port = options.port ?? 4173;
  const host = options.host ?? '127.0.0.1';

  const server = createServer(async (request, response) => {
    try {
      let target = resolveSafe(dir, request.url ?? '/');
      if (target === null) {
        response.writeHead(403).end('Chemin refusé');
        return;
      }

      // Un dossier se termine par un slash : on sert son index.html.
      const info = await stat(target).catch(() => null);
      if (info?.isDirectory()) target = join(target, 'index.html');

      const body = await readFile(target);
      response.writeHead(200, {
        'Content-Type': MIME[extname(target)] ?? 'application/octet-stream',
        // Les modules ES doivent être revalidés en développement.
        'Cache-Control': 'no-store',
      });
      response.end(body);
    } catch {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Introuvable. Avez-vous lancé « npm run build » ?');
    }
  });

  await new Promise((resolvePromise, reject) => {
    server.once('error', reject);
    server.listen(port, host, resolvePromise);
  });

  const address = server.address();
  const url = `http://${host}:${address.port}/`;

  return {
    url,
    close: () => new Promise((resolvePromise) => server.close(resolvePromise)),
  };
}

// Exécution directe.
if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  const option = (name) => {
    const found = process.argv.find((arg) => arg.startsWith(`--${name}=`));
    return found ? found.slice(name.length + 3) : undefined;
  };

  const port = option('port') ? Number(option('port')) : 4173;
  // `--dir=` sert la variante de l'extension : `app.html` n'existe que dans
  // `dist/extension*`, pas dans `dist/web`.
  const dir = option('dir') ? resolve(ROOT, option('dir')) : undefined;

  const { url } = await serve({ port, dir });
  console.log(`Application servie sur ${url}`);
  if (dir) console.log(`Dossier servi : ${dir}`);
  console.log('Arrêtez avec Ctrl+C.');
}
