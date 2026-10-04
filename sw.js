// Service worker : fonctionnement hors ligne.
// À CHAQUE mise à jour de data/ : incrémenter VERSION pour forcer le rafraîchissement du cache.
const VERSION = '2026-10-04.15';
const CACHE = 'argumentaire-' + VERSION;

const FICHIERS = [
  './',
  'index.html',
  'css/style.css',
  'js/reseaux.js',
  'js/app.js',
  'manifest.webmanifest',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'data/faits.json',
  'data/repliques.json',
  'data/actus.json',
  'data/boycotts.json',
  'data/parcours.json',
  'data/meta.json',
  'data/reseaux.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FICHIERS)).then(() => self.skipWaiting()));
});

// Supprime les anciens caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((cles) => Promise.all(cles.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;

  // Données : réseau d'abord (contenu frais), cache si hors ligne
  if (req.url.includes('/data/')) {
    e.respondWith(
      fetch(req)
        .then((rep) => {
          const copie = rep.clone();
          caches.open(CACHE).then((c) => c.put(req, copie));
          return rep;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // Reste de l'app : cache d'abord, puis réseau ; page d'accueil en secours
  e.respondWith(
    caches.match(req).then((r) => r || fetch(req).catch(() => caches.match('index.html')))
  );
});
