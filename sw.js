// Ha jövőben frissítesz valamit (css, js), ezt a v2-t írd át v3-ra, v4-re stb.!
const CACHE_NAME = 'csapo-v2'; 
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './jquery-3.4.1.js',
  './html5-qrcode.js',
  './manifest.json',
  './icon.png'
];

// Telepítéskor lementjük a fájlokat
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting(); // Azonnal aktiválja az új verziót
});

// Aktiváláskor kitöröljük a RÉGI (v1, stb.) cache-t!
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Régi cache törlése:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim(); // Azonnal átveszi az irányítást
});

// Hálózatról vagy cache-ből töltés
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );
});