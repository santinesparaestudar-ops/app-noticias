importScripts('firebase-config-sw.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');

firebase.initializeApp(self.firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage(async payload => {
  const { title, body } = payload.notification || {};
  self.registration.showNotification(title || 'Notícias', {
    body: body || '',
    icon: '/icons/icon-192.png',
  });

  if ('setAppBadge' in navigator) {
    const incremento = parseInt(payload.data?.count || '1', 10) || 1;
    const total = await incrementarBadge(incremento);
    navigator.setAppBadge(total).catch(() => {});
  }
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      if (clients.length > 0) return clients[0].focus();
      return self.clients.openWindow('/');
    })
  );
});

function incrementarBadge(incremento) {
  return new Promise(resolve => {
    const req = indexedDB.open('noticias-badge', 1);
    req.onupgradeneeded = () => req.result.createObjectStore('contagem');
    req.onsuccess = () => {
      const db = req.result;
      const tx = db.transaction('contagem', 'readwrite');
      const store = tx.objectStore('contagem');
      const getReq = store.get('total');
      getReq.onsuccess = () => {
        const novo = (getReq.result || 0) + incremento;
        store.put(novo, 'total');
        tx.oncomplete = () => resolve(novo);
      };
    };
    req.onerror = () => resolve(incremento);
  });
}

const CACHE_NAME = 'noticias-shell-v1';
const ARQUIVOS_APP_SHELL = ['/', '/index.html', '/style.css', '/app.js', '/manifest.json'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ARQUIVOS_APP_SHELL)));
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.mode === 'navigate' || ARQUIVOS_APP_SHELL.includes(url.pathname)) {
    event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request)));
  }
});
