// Service Worker pour Le Sommelier IA
const CACHE_NAME = 'sommelier-ia-v3';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Ignorer les requêtes non-http (ex: chrome-extension)
  if (!event.request.url.startsWith('http')) return;
  
  // Stratégie Stale-While-Revalidate
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          // Mettre en cache seulement les réponses valides (status 200)
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
             cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => {
           // Erreur réseau (offline), on ne fait rien
        });
        
        // Retourner le cache s'il existe, sinon attendre le réseau
        return cachedResponse || fetchPromise;
      });
    })
  );
});