const CACHE_NAME = 'prsk-calc-v1';
const urlsToCache = [
    '.',
    'index.html',
    'manifest_ko.json',
    'manifest_ja.json',
    'icon192.png',
    'icon2.png'
];

self.addEventListener('install', (event) => {
    // Perform install steps
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
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
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('push', function (event) {
    if (event.data) {
        let data = {};
        try {
            data = event.data.json();
        } catch (e) {
            data = { title: 'Proseka Calendar', body: event.data.text() };
        }

        const options = {
            body: data.body,
            icon: '/prsk-calc/icon.png', // Adjusted for GitHub Pages
            badge: '/prsk-calc/icon.png',
            data: {
                url: self.registration.scope
            }
        };

        event.waitUntil(
            self.registration.showNotification(data.title || 'Proseka Calculator', options)
        );
    }
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data.url)
    );
});

self.addEventListener('fetch', (event) => {
    // Check if the request is for an installed PWA start URL
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).catch(() => {
                return caches.match('index.html') || caches.match('.');
            })
        );
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Cache hit - return response
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
    );
});
