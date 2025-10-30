const CACHE_NAME = 'totalprod-cache-v1.9.0';
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
        // Precargar recursos base para que el nuevo CACHE_NAME exista en install
        return cache.addAll(urlsToCache).catch(err => {
          console.warn('⚠️ Error precache addAll, continuando:', err);
        });
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
        // Si está en caché, devolverlo
        if (response) {
          console.log('📦 Sirviendo desde caché:', url.pathname);
          return response;
        }
        
        // Si no está en caché, buscar en red y guardar
        return fetch(request)
          .then(response => {
            // Cachear respuestas exitosas
            if (response && response.status === 200) {
              const responseToCache = response.clone();
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(request, responseToCache);
                  console.log('💾 Guardando en caché:', url.pathname);
                })
                .catch(cacheError => {
                  console.warn('⚠️ Error guardando en caché:', cacheError);
                });
            }
            return response;
          })
          .catch(error => {
            console.warn('❌ Error en fetch:', url.pathname, error);
            return fetch(request); // Intentar fetch normal como fallback
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

// Utilidad: enviar mensaje a todos los clientes controlados
async function broadcastMessage(message) {
  const clientsList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  for (const client of clientsList) {
    client.postMessage(message);
  }
}

// Manejar mensajes desde la app (por ejemplo, al recuperar el foco)
self.addEventListener('message', async (event) => {
  const data = event.data || {};
  if (data && data.type === 'CHECK_FOR_UPDATE') {
    try {
      // Forzar chequeo de actualización del SW
      await self.registration.update();

      // Detectar si hay un SW en espera
      if (self.registration.waiting) {
        await broadcastMessage({ type: 'UPDATE_AVAILABLE', source: 'sw', reason: 'waiting_sw' });
        return;
      }

      // Alternativa: comparar caches por nombre (ej. totalprod-cache-vX)
      const cacheNames = await caches.keys();
      const latestCache = cacheNames.find(name => name.startsWith('totalprod-cache-v'));
      if (latestCache && latestCache !== CACHE_NAME) {
        await broadcastMessage({ type: 'UPDATE_AVAILABLE', source: 'sw', reason: 'new_cache', cacheName: latestCache });
      }
    } catch (err) {
      // Avisar fallo opcionalmente
      await broadcastMessage({ type: 'UPDATE_CHECK_FAILED', error: String(err) });
    }
  }

  // Permitir activar inmediatamente el nuevo SW bajo demanda
  if (data && data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});