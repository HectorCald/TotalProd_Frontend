const CACHE_NAME = 'totalprod-cache-v3';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/icon.png'
];

self.addEventListener('install', event => {
  console.log('🚀 Service Worker instalándose...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Cache abierto, instalando...');
        // No cachear archivos específicos al instalar, solo abrir el cache
        return Promise.resolve();
      })
      .then(() => {
        console.log('✅ Service Worker instalado correctamente');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('❌ Error instalando Service Worker:', error);
      })
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  
  // Solo interceptar requests del mismo origen
  if (url.origin !== location.origin) {
    return;
  }
  
  // No interceptar requests de API o datos
  if (url.pathname.startsWith('/api/') || url.pathname.includes('?')) {
    return;
  }
  
  event.respondWith(
    caches.match(request)
      .then(response => {
        // Si está en caché, devolverlo inmediatamente
        if (response) {
          console.log('📦 Sirviendo desde caché:', url.pathname);
          return response;
        }
        
        // Si no está en caché, intentar fetch
        return fetch(request)
          .then(response => {
            // Cachear respuestas exitosas
            if (response && response.status === 200) {
              const responseToCache = response.clone();
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(request, responseToCache);
                  console.log('💾 Guardando en caché:', url.pathname);
                });
            }
            return response;
          })
          .catch(error => {
            console.warn('❌ Sin internet, buscando en caché:', url.pathname);
            // Si no hay internet, buscar en caché como fallback
            return caches.match(request);
          });
      })
  );
});

self.addEventListener('activate', event => {
  console.log('🔄 Service Worker activándose...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Eliminando cache antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ Service Worker activado correctamente');
      return self.clients.claim();
    })
  );
});
