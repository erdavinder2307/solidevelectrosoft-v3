/**
 * Service Worker for Solidev Electrosoft Website
 * Provides caching strategies for better performance and offline experience
 */

const CACHE_NAME = 'solidev-v1.0.0';
const STATIC_CACHE = 'solidev-static-v1.0.0';
const DYNAMIC_CACHE = 'solidev-dynamic-v1.0.0';

// Files to cache immediately
const STATIC_FILES = [
    '/',
    '/index.html',
    '/about.html',
    '/contact.html',
    '/project.html',
    '/faq.html',
    '/assets/css/bootstrap.css',
    '/assets/css/style.css',
    '/assets/js/vendor/jquery.js',
    '/assets/js/bootstrap-bundle.js',
    '/assets/js/main.js',
    'https://solidevwebsitev3.blob.core.windows.net/solidev/assets/img/logo/logo.png',
    'https://solidevwebsitev3.blob.core.windows.net/solidev/assets/img/favicon.webp'
];

// Install event - cache static files
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => {
                console.log('[SW] Caching static files');
                return cache.addAll(STATIC_FILES);
            })
            .then(() => {
                console.log('[SW] Static files cached successfully');
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('[SW] Failed to cache static files:', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(keys => {
                return Promise.all(
                    keys.filter(key => {
                        return key !== STATIC_CACHE && key !== DYNAMIC_CACHE;
                    }).map(key => {
                        console.log('[SW] Deleting old cache:', key);
                        return caches.delete(key);
                    })
                );
            })
            .then(() => {
                console.log('[SW] Old caches cleaned up');
                return self.clients.claim();
            })
    );
});

// Fetch event - serve cached files or fetch from network
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Handle HTML pages with network-first strategy
    if (request.headers.get('accept').includes('text/html')) {
        event.respondWith(
            fetch(request)
                .then(response => {
                    // Cache successful responses
                    if (response.status === 200) {
                        const responseClone = response.clone();
                        caches.open(DYNAMIC_CACHE)
                            .then(cache => cache.put(request, responseClone));
                    }
                    return response;
                })
                .catch(() => {
                    // Fallback to cache if network fails
                    return caches.match(request)
                        .then(response => {
                            return response || caches.match('/index.html');
                        });
                })
        );
        return;
    }

    // Handle static assets with cache-first strategy
    if (url.pathname.startsWith('/assets/') || url.hostname === 'solidevwebsitev3.blob.core.windows.net') {
        event.respondWith(
            caches.match(request)
                .then(response => {
                    if (response) {
                        return response;
                    }
                    
                    return fetch(request)
                        .then(response => {
                            // Cache successful responses
                            if (response.status === 200) {
                                const responseClone = response.clone();
                                caches.open(DYNAMIC_CACHE)
                                    .then(cache => cache.put(request, responseClone));
                            }
                            return response;
                        });
                })
        );
        return;
    }

    // Default: network-first for everything else
    event.respondWith(
        fetch(request)
            .catch(() => caches.match(request))
    );
});

// Background sync for form submissions
self.addEventListener('sync', event => {
    if (event.tag === 'contact-form-sync') {
        event.waitUntil(
            // Handle offline form submissions here
            console.log('[SW] Background sync triggered for contact form')
        );
    }
});

// Push notifications (if needed in future)
self.addEventListener('push', event => {
    const options = {
        body: event.data ? event.data.text() : 'New notification from Solidev Electrosoft',
        icon: '/assets/img/favicon.webp',
        badge: '/assets/img/favicon.webp',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        }
    };

    event.waitUntil(
        self.registration.showNotification('Solidev Electrosoft', options)
    );
});
