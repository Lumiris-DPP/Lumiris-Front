// Service worker Web Push. Pas de cache d'app shell ici — seul le canal push est couvert par ce
// ticket, l'installabilité/offline complet est un chantier séparé.

self.addEventListener('push', (event) => {
    let payload = {};
    if (event.data) {
        try {
            payload = event.data.json();
        } catch {
            payload = { title: 'Lumiris', body: event.data.text() };
        }
    }
    const title = payload.title || 'Lumiris';
    const options = {
        body: payload.body || '',
        icon: '/icon.svg',
        badge: '/icon.svg',
        data: { url: payload.url || '/' },
    };
    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const url = (event.notification.data && event.notification.data.url) || '/';
    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if (client.url.includes(url) && 'focus' in client) {
                    return client.focus();
                }
            }
            if (self.clients.openWindow) {
                return self.clients.openWindow(url);
            }
        }),
    );
});
