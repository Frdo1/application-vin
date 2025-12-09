
// Service Worker pour Le Sommelier IA
const CACHE_NAME = 'sommelier-ia-v5';

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
  // Ignorer les requêtes non-http
  if (!event.request.url.startsWith('http')) return;
  
  // Stratégie Stale-While-Revalidate
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          // MODIFICATION CRITIQUE : 
          // On autorise 'basic' (fichiers internes) ET 'cors' (images externes IA/Google)
          if (networkResponse && networkResponse.status === 200 && (networkResponse.type === 'basic' || networkResponse.type === 'cors')) {
             cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => {
           // Erreur réseau (offline)
        });
        
        // Retourner le cache s'il existe, sinon attendre le réseau
        return cachedResponse || fetchPromise;
      });
    })
  );
});