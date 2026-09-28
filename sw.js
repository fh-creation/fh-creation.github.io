// Keep installation small: product photos are embedded in the catalogue HTML.
const VERSION = 'fh-catalogue-v2';
const CORE = VERSION + '-core';
const PAGES = VERSION + '-pages';
const IMAGES = VERSION + '-images';
const OLD = 'fh-catalogue-v1';
const CATALOGUE = new URL('./3-7-catalogue-36.html', self.location).href;
const SHELL = ['./manifest.json', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CORE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(
    keys.filter((key) => key.startsWith('fh-catalogue-') && ![CORE, PAGES, IMAGES, OLD].includes(key))
      .map((key) => caches.delete(key))
  )).then(() => self.clients.claim()));
});

function offlineShell() {
  return new Response(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#fbeef0"><title>FH Creation - Offline</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#fffaf8;color:#523949;font:16px/1.5 system-ui,sans-serif;text-align:center}main{padding:32px;max-width:360px}img{width:80px;height:80px;border-radius:20px}h1{font-size:28px}a{display:inline-block;margin-top:12px;padding:12px 22px;background:#a43f75;color:white;border-radius:24px;text-decoration:none}</style><main><img src="./icon-192.png" alt="FH Creation"><h1>You're offline</h1><p>Connect to the internet to open the FH Creation catalogue. After you've opened it online with the app installed, it will be available offline too.</p><a href="./3-7-catalogue-36.html">Try again</a></main></html>`, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response.ok) {
          const copy = response.clone();
          event.waitUntil(caches.open(PAGES).then((cache) => cache.put(CATALOGUE, copy))
            .then(() => caches.delete(OLD)).catch(() => {}));
        }
        return response;
      } catch (_) {
        return await caches.match(CATALOGUE) || offlineShell();
      }
    })());
    return;
  }

  if (request.destination === 'image') {
    event.respondWith(caches.match(request).then((hit) => hit || fetch(request).then((response) => {
      if (response.ok) event.waitUntil(caches.open(IMAGES).then((cache) => cache.put(request, response.clone())).catch(() => {}));
      return response;
    })));
    return;
  }

  event.respondWith(caches.match(request).then((hit) => hit || fetch(request)));
});
