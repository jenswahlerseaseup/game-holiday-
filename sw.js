// Service Worker — caches all game assets for offline play
const CACHE  = 'forest-memories-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
  './src/palette.js',
  './src/AudioSystem.js',
  './src/DrawUtils.js',
  './src/DialogueSystem.js',
  './src/main.js',
  './src/scenes/OpeningScene.js',
  './src/scenes/CarScene.js',
  './src/scenes/VillageScene.js',
  './src/scenes/ForestScene.js',
  './src/scenes/ShopScene.js',
  './src/scenes/EndScene.js',
  // Phaser CDN
  'https://cdn.jsdelivr.net/npm/phaser@3.80.1/dist/phaser.min.js',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  // Remove old caches
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        // Cache new successful responses
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return response;
      }).catch(() => cached); // fallback to cache on network error
    })
  );
});
