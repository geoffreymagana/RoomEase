const CACHE_NAME = 'roomease-v1';
const STATIC_CACHE_NAME = 'roomease-static-v1';
const DYNAMIC_CACHE_NAME = 'roomease-dynamic-v1';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/auth/signin',
  '/auth/signup',
  '/dashboard',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png'
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
  /^https:\/\/firestore\.googleapis\.com/,
  /^https:\/\/firebase\.googleapis\.com/
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Service Worker: Static assets cached');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Error caching static assets', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension requests
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  // Handle different types of requests
  if (request.destination === 'document') {
    // HTML pages - network first, fallback to cache
    event.respondWith(networkFirstStrategy(request));
  } else if (isStaticAsset(request)) {
    // Static assets - cache first
    event.respondWith(cacheFirstStrategy(request));
  } else if (isAPIRequest(request)) {
    // API requests - network first with cache fallback
    event.respondWith(networkFirstStrategy(request, DYNAMIC_CACHE_NAME));
  } else {
    // Other requests - network first
    event.respondWith(networkFirstStrategy(request, DYNAMIC_CACHE_NAME));
  }
});

// Network first strategy
async function networkFirstStrategy(request, cacheName = STATIC_CACHE_NAME) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Network failed, trying cache', request.url);
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for navigation requests
    if (request.destination === 'document') {
      const offlinePage = await caches.match('/offline.html');
      if (offlinePage) {
        return offlinePage;
      }
    }
    
    throw error;
  }
}

// Cache first strategy
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.status === 200) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Service Worker: Failed to fetch', request.url, error);
    throw error;
  }
}

// Check if request is for static asset
function isStaticAsset(request) {
  const url = new URL(request.url);
  return (
    request.destination === 'image' ||
    request.destination === 'script' ||
    request.destination === 'style' ||
    url.pathname.includes('/static/') ||
    url.pathname.includes('/_next/') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.jpeg') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.ico')
  );
}

// Check if request is for API
function isAPIRequest(request) {
  const url = new URL(request.url);
  return (
    url.pathname.startsWith('/api/') ||
    API_CACHE_PATTERNS.some(pattern => pattern.test(request.url))
  );
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  try {
    // Get pending actions from IndexedDB
    const pendingActions = await getPendingActions();
    
    for (const action of pendingActions) {
      try {
        await syncAction(action);
        await removePendingAction(action.id);
      } catch (error) {
        console.error('Service Worker: Failed to sync action', action, error);
      }
    }
  } catch (error) {
    console.error('Service Worker: Background sync failed', error);
  }
}

// Placeholder functions for offline sync
async function getPendingActions() {
  // TODO: Implement IndexedDB operations
  return [];
}

async function syncAction(action) {
  // TODO: Implement action synchronization
  console.log('Syncing action:', action);
}

async function removePendingAction(actionId) {
  // TODO: Implement IndexedDB removal
  console.log('Removing synced action:', actionId);
}

// Push notification handler
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push received', event);
  
  const options = {
    body: 'You have new updates in RoomEase',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Details',
        icon: '/icon-192.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icon-192.png'
      }
    ]
  };
  
  if (event.data) {
    const data = event.data.json();
    options.body = data.body || options.body;
    options.title = data.title || 'RoomEase';
    options.data = { ...options.data, ...data.data };
  }
  
  event.waitUntil(
    self.registration.showNotification('RoomEase', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked', event);
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/dashboard')
    );
  } else if (event.action === 'close') {
    // Just close the notification
  } else {
    // Default click action
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

console.log('Service Worker: Loaded');