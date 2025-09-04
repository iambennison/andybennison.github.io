const js = `
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js');

if (workbox) {
  workbox.core.skipWaiting();
  workbox.core.clientsClaim();

  workbox.core.setCacheNameDetails({
    prefix: 'thn-sw',
    suffix: 'v22',
    precache: 'install-time',
    runtime: 'run-time'
  });

  const FALLBACK_HTML_URL = '/offline.html';
  const version = workbox.core.cacheNames.suffix;

  workbox.precaching.precacheAndRoute([
    { url: FALLBACK_HTML_URL, revision: null },
    { url: 'https://static.andybennison.com/data/app/scripts/manifest.json', revision: null },
    { url: 'https://static.andybennison.com/data/app/icons/favicon-48x48.ico', revision: null }
  ]);

  workbox.routing.setDefaultHandler(new workbox.strategies.NetworkOnly());

  workbox.routing.registerRoute(
    new RegExp('.(?:css|js|webp|png|gif|jpg|svg|ico)$'),
    new workbox.strategies.CacheFirst({
      cacheName: 'images-js-css-' + version,
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxAgeSeconds: 60 * 24 * 60 * 60,
          maxEntries: 200,
          purgeOnQuotaError: true
        })
      ]
    }),
    'GET'
  );

  workbox.routing.setCatchHandler(async ({ event }) => {
    switch (event.request.destination) {
      case 'document':
        return caches.match(FALLBACK_HTML_URL);
      default:
        return Response.error();
    }
  });

  self.addEventListener('activate', function (event) {
    event.waitUntil(
      caches
        .keys()
        .then(keys => keys.filter(key => !key.endsWith(version)))
        .then(keys => Promise.all(keys.map(key => caches.delete(key))))
    );
  });
} else {
  console.log('Oops! Workbox did not load');
}
`;

async function handleRequest(request) {
  return new Response(js, {
    headers: {
      'Content-Type': 'application/javascript;charset=UTF-8',
      'Service-Worker-Allowed': '/',
      'Cache-Control': 'public, max-age=0, must-revalidate'
    }
  });
}

addEventListener('fetch', event => {
  return event.respondWith(handleRequest(event.request));
});
