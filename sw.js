// sw.js — Service Worker para notificações de estudo
// Ayrton Questões — PM-MA

self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

// Recebe notificação push (disparada pelo próprio dispositivo via alarm)
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || '📘 Hora de estudar!';
  const options = {
    body: data.body || 'Ayrton Questões te aguarda. Vamos treinar para a PM-MA?',
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/icon-192.png',
    vibrate: [200, 100, 200],
    tag: 'estudo-pmma',
    renotify: true,
    actions: [
      { action: 'abrir', title: '▶ Estudar agora' },
      { action: 'fechar', title: 'Mais tarde' }
    ]
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  if (event.action === 'fechar') return;
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if (client.url.includes(self.location.origin) && 'focus' in client)
          return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});

// ── Alarme local (sem servidor push — agenda via setTimeout no cliente,
//    persistindo via IndexedDB para disparar mesmo com a aba fechada)
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SCHEDULE_NOTIFICATION') {
    const { title, body, delayMs } = event.data;
    setTimeout(() => {
      self.registration.showNotification(title || '📘 Hora de estudar!', {
        body: body || 'Ayrton Questões te aguarda. Vamos treinar para a PM-MA?',
        vibrate: [200, 100, 200],
        tag: 'estudo-pmma',
        renotify: true,
        actions: [
          { action: 'abrir', title: '▶ Estudar agora' },
          { action: 'fechar', title: 'Mais tarde' }
        ]
      });
    }, delayMs);
  }
});
