// sw.js — Service Worker para Web Push real (VAPID)
// Ayrton Questões — PM-MA

self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

// Recebe push do servidor (Edge Function via VAPID)
self.addEventListener('push', event => {
  let data = { title: '📘 Hora de estudar!', body: 'Ayrton Questões te aguarda. Bora treinar para a PM-MA? 🎯' };
  try { if (event.data) data = { ...data, ...event.data.json() }; } catch(e) {}

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      vibrate: [200, 100, 200, 100, 200],
      tag: 'estudo-pmma',
      renotify: true,
      requireInteraction: false,
      actions: [
        { action: 'abrir',  title: '▶ Estudar agora' },
        { action: 'fechar', title: 'Mais tarde'       }
      ]
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  if (event.action === 'fechar') return;
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if (c.url.includes(self.location.origin) && 'focus' in c) return c.focus();
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});
