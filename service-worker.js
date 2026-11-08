// Меняй версию при каждом обновлении игры, чтобы у игроков обновился кэш
const CACHE = 'star-orbit-v1';
const CORE = ['./', 'index.html', 'manifest.webmanifest',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-180.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Supabase (аккаунты, мультиплеер, realtime) никогда не кэшируем
  if (url.hostname.endsWith('supabase.co') || url.hostname.endsWith('supabase.in')) return;

  // Страница: сначала сеть (свежая версия), если офлайн — из кэша
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(r => {
      const copy = r.clone(); caches.open(CACHE).then(c => c.put('index.html', copy)); return r;
    }).catch(() => caches.match('index.html')));
    return;
  }

  // Скины, звуки, музыка, скрипты: из кэша, а если нет — грузим и запоминаем
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
    if (r.ok && (url.origin === location.origin || url.hostname === 'cdn.jsdelivr.net')) {
      const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy));
    }
    return r;
  })));
});
