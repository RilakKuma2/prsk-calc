const CACHE_NAME = 'prsk-calc-v2';
const urlsToCache = [
    'manifest_ko.json',
    'manifest_ja.json',
    'manifest_en.json',
    'icon192.png',
    'icon.png',
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

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
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
