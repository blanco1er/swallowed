// Offline cache — an emergency app must open and work for typed items without a network.
// Page, code and data: network first (a new version always wins), cache after 4 s or offline.
// Photos, icons and the font: cache first. /api is never cached. Only responses marked by our
// own server are stored, so Render's "waking up" page can never be cached as the app.

const SHELL = 'swallowed-shell-v2';
const ASSETS = 'swallowed-assets-v1';
const TIMEOUT_MS = 4000;
const BASE = new URL('./', self.location).pathname; // "/" on Render, "/swallowed/" on GitHub Pages
const PRECACHE = ['', 'styles.css', 'js/app.js', 'js/match.js', 'js/verdict.js', 'js/summary.js', 'js/speech.js', 'js/i18n.js',
  'data/toxins.json', 'data/fr.json', 'data/signs.json', 'data/contacts.json', 'manifest.webmanifest'].map((p) => BASE + p);
const IMAGES = ['hero', 'chocolate', 'grapes', 'lily', 'pills', 'gum', 'onion', 'dog', 'cat', 'rabbit', 'guineapig', 'bird', 'icon-180', 'icon-64']
  .map((n) => `${BASE}img/${n}.${n.startsWith('icon') ? 'png' : 'jpg'}`);
// On Render, only responses marked by our server are cached (never its "waking up" page).
const NEEDS_MARK = self.location.hostname.endsWith('onrender.com');

self.addEventListener('install', (event) => event.waitUntil((async () => {
  await (await caches.open(SHELL)).addAll(PRECACHE.map((u) => new Request(u, { cache: 'reload' })));
  await (await caches.open(ASSETS)).addAll(IMAGES).catch(() => {});
  await self.skipWaiting();
})()));

self.addEventListener('activate', (event) => event.waitUntil((async () => {
  for (const key of await caches.keys()) if (![SHELL, ASSETS].includes(key)) await caches.delete(key);
  await self.clients.claim();
})()));

const withTimeout = (promise, ms) => Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))]);

async function networkFirst(event, request, key) {
  const cache = await caches.open(SHELL);
  const fromNetwork = fetch(request, { cache: 'no-cache' }).then(async (res) => {
    if (!res.ok || (NEEDS_MARK && !res.headers.get('x-swallowed'))) throw new Error('not-ours');
    await cache.put(key, res.clone());
    return res;
  });
  event.waitUntil(fromNetwork.catch(() => {})); // keeps refreshing the cache after a timeout
  try {
    return await withTimeout(fromNetwork, TIMEOUT_MS);
  } catch {
    return (await cache.match(key, { ignoreSearch: true })) || fetch(request);
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(ASSETS);
  const hit = await cache.match(request);
  if (hit) return hit;
  const res = await fetch(request);
  if (res.ok || res.type === 'opaque') cache.put(request, res.clone());
  return res;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (/(^|\.)fontshare\.com$/.test(url.hostname)) { event.respondWith(cacheFirst(request)); return; }
  if (url.origin !== self.location.origin || !url.pathname.startsWith(BASE)) return;
  const path = url.pathname.slice(BASE.length);
  if (path.startsWith('api/') || path === 'healthz' || path === 'sw.js') return;
  if (path.startsWith('img/')) { event.respondWith(cacheFirst(request)); return; }
  const key = request.mode === 'navigate' ? BASE : url.pathname;
  event.respondWith(networkFirst(event, request, key));
});
