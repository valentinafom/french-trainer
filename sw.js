const CACHE_NAME = 'french-trainer-v5';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './french-numbers.html',
  './vocab.html',
  './verbs.html',
  './animals.html',
  './styles.css',
  './common.js',
  './vocab-trainer.js',
  './data/animals.js',
  './data/colours.js',
  './data/days.js',
  './data/months.js',
  './data/professions.js',
  './data/verbs.js',
  './icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Cache hit - return response
      if (response) {
        return response;
      }
      return fetch(event.request);
    })
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
