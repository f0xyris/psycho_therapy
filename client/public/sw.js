// Service Worker для LaserTouch - ВРЕМЕННО ОТКЛЮЧЕН
console.log('Service Worker отключен для тестирования');

// Отключаем все обработчики событий
self.addEventListener('install', (event) => {
  console.log('Service Worker install отключен');
  event.waitUntil(Promise.resolve());
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activate отключен');
  event.waitUntil(Promise.resolve());
});

self.addEventListener('fetch', (event) => {
  console.log('Service Worker fetch отключен');
  // Не перехватываем запросы
  return;
});

// Остальной код закомментирован
/*
const CACHE_NAME = 'lasertouch-v1.0.0';
const STATIC_CACHE = 'lasertouch-static-v1.0.0';
const DYNAMIC_CACHE = 'lasertouch-dynamic-v1.0.0';

// Критические ресурсы для кэширования
const CRITICAL_RESOURCES = [
  '/',
  '/index.html',
  '/src/main.tsx',
  '/src/index.css',
  '/src/critical.css',
];

// Статические ресурсы
const STATIC_RESOURCES = [
  '/assets/',
  '/images/',
  '/fonts/',
  'https://images.unsplash.com/',
  'https://fonts.googleapis.com/',
  'https://fonts.gstatic.com/',
];

// Стратегии кэширования
const CACHE_STRATEGIES = {
  NETWORK_FIRST: 'network-first',
  CACHE_FIRST: 'cache-first',
  NETWORK_ONLY: 'network-only',
  CACHE_ONLY: 'cache-only',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
};

// Установка Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        return cache.addAll(CRITICAL_RESOURCES);
      })
      .then(() => {
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Ошибка установки Service Worker:', error);
      })
  );
});

// Активация Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        return self.clients.claim();
      })
  );
});

// Перехват запросов
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') {
    return;
  }

  if (url.protocol === 'chrome-extension:' || url.protocol === 'chrome:') {
    return;
  }

  const strategy = getCacheStrategy(request);
  
  event.respondWith(
    handleRequest(request, strategy)
      .catch((error) => {
        console.error('❌ Ошибка обработки запроса:', error);
        return handleOfflineFallback(request);
      })
  );
});

// Определение стратегии кэширования
function getCacheStrategy(request) {
  const url = new URL(request.url);
  if (CRITICAL_RESOURCES.some(resource => url.pathname.includes(resource))) {
    return CACHE_STRATEGIES.CACHE_FIRST;
  }
  if (STATIC_RESOURCES.some(resource => url.href.includes(resource))) {
    return CACHE_STRATEGIES.CACHE_FIRST;
  }
  if (url.pathname.startsWith('/api/')) {
    return CACHE_STRATEGIES.NETWORK_FIRST;
  }
  if (request.headers.get('accept')?.includes('text/html')) {
    return CACHE_STRATEGIES.NETWORK_FIRST;
  }
  return CACHE_STRATEGIES.STALE_WHILE_REVALIDATE;
}

// Обработка запросов
async function handleRequest(request, strategy) {
  switch (strategy) {
    case CACHE_STRATEGIES.CACHE_FIRST:
      return cacheFirst(request);
    case CACHE_STRATEGIES.NETWORK_FIRST:
      return networkFirst(request);
    case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
      return staleWhileRevalidate(request);
    case CACHE_STRATEGIES.NETWORK_ONLY:
      return networkOnly(request);
    case CACHE_STRATEGIES.CACHE_ONLY:
      return cacheOnly(request);
    default:
      return networkFirst(request);
  }
}

// Стратегия: Cache First
async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('❌ Cache First: Ошибка сети', error);
    throw error;
  }
}

// Стратегия: Network First
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cache = await caches.open(DYNAMIC_CACHE);
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// Стратегия: Stale While Revalidate
async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cachedResponse = await cache.match(request);
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch((error) => {
    console.error('❌ Stale While Revalidate: Ошибка сети', error);
  });
  return cachedResponse || fetchPromise;
}

// Стратегия: Network Only
async function networkOnly(request) {
  return fetch(request);
}

// Стратегия: Cache Only
async function cacheOnly(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  throw new Error('Resource not found in cache');
}

// Оффлайн fallback
async function handleOfflineFallback(request) {
  const url = new URL(request.url);
  if (request.headers.get('accept')?.includes('text/html')) {
    const cache = await caches.open(STATIC_CACHE);
    const offlinePage = await cache.match('/offline.html');
    if (offlinePage) {
      return offlinePage;
    }
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>LaserTouch - Оффлайн</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { 
              font-family: system-ui, sans-serif; 
              text-align: center; 
              padding: 2rem; 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .container { max-width: 500px; }
            h1 { font-size: 2rem; margin-bottom: 1rem; }
            p { font-size: 1.1rem; opacity: 0.9; }
            .retry-btn {
              background: rgba(255,255,255,0.2);
              border: 2px solid rgba(255,255,255,0.3);
              color: white;
              padding: 12px 24px;
              border-radius: 8px;
              cursor: pointer;
              margin-top: 1rem;
              font-size: 1rem;
            }
            .retry-btn:hover { background: rgba(255,255,255,0.3); }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🌐 Нет подключения к интернету</h1>
            <p>К сожалению, страница недоступна в оффлайн режиме.</p>
            <p>Проверьте подключение к интернету и попробуйте снова.</p>
            <button class="retry-btn" onclick="window.location.reload()">
              🔄 Обновить страницу
            </button>
          </div>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });
  }
  if (request.headers.get('accept')?.includes('image/')) {
    return new Response(`
      <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f3f4f6"/>
        <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#6b7280" font-family="system-ui" font-size="16">
          Изображение недоступно
        </text>
      </svg>
    `, {
      headers: { 'Content-Type': 'image/svg+xml' }
    });
  }
  return new Response('Resource not available offline', {
    status: 503,
    statusText: 'Service Unavailable'
  });
}

// Обработка сообщений от основного потока
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
    case 'CACHE_URLS':
      cacheUrls(data.urls);
      break;
    case 'DELETE_CACHE':
      deleteCache(data.cacheName);
      break;
    case 'GET_CACHE_INFO':
      getCacheInfo().then(info => {
        event.ports[0].postMessage(info);
      });
      break;
  }
});

// Кэширование URL'ов
async function cacheUrls(urls) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const promises = urls.map(url => 
    fetch(url).then(response => {
      if (response.ok) {
        return cache.put(url, response);
      }
    }).catch(error => {
      console.error('❌ Ошибка кэширования:', url, error);
    })
  );
  await Promise.all(promises);
}

// Удаление кэша
async function deleteCache(cacheName) {
  const deleted = await caches.delete(cacheName);
  return deleted;
}

// Получение информации о кэше
async function getCacheInfo() {
  const cacheNames = await caches.keys();
  const cacheInfo = {};
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    cacheInfo[cacheName] = {
      size: keys.length,
      urls: keys.map(request => request.url)
    };
  }
  return cacheInfo;
}

// Периодическая очистка старых кэшей
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'cleanup-cache') {
    event.waitUntil(cleanupOldCaches());
  }
});

// Очистка старых кэшей
async function cleanupOldCaches() {
  const cacheNames = await caches.keys();
  const currentCaches = [STATIC_CACHE, DYNAMIC_CACHE];
  for (const cacheName of cacheNames) {
    if (!currentCaches.includes(cacheName)) {
      await caches.delete(cacheName);
    }
  }
}
*/ 