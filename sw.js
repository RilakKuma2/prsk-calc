self.addEventListener('install', (event) => {
    self.skipWaiting(); // Always install immediately
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim()); // Take control of all clients immediately
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
