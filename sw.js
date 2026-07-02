/* sw.js — offline cache for the whole app (cache-first).
   Bump CACHE_VERSION whenever you edit any file so devices pick up changes. */
var CACHE_VERSION = "ielts-trainer-v5";

var ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./css/styles.css",
  "./data/grammar.js",
  "./data/vocab.js",
  "./data/phonetics.js",
  "./data/pron_dict.js",
  "./data/collocations.js",
  "./data/writing_prompts.js",
  "./data/roadmap.js",
  "./data/modules/_index.js",
  "./data/modules/articles.js",
  "./data/modules/verb_forms.js",
  "./data/modules/copula_agreement.js",
  "./data/modules/reversal_pairs.js",
  "./data/modules/phonetics.js",
  "./data/modules/collocations.js",
  "./js/config.js",
  "./js/engine.js",
  "./js/storage.js",
  "./js/sync.js",
  "./js/drills.js",
  "./js/session.js",
  "./js/diagrams.js",
  "./js/dashboard.js",
  "./js/prompts.js",
  "./js/app.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE_VERSION).then(function (c) { return c.addAll(ASSETS); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k !== CACHE_VERSION) return caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(function (hit) {
      return hit || fetch(e.request).then(function (res) {
        // cache new same-origin responses opportunistically
        if (res.ok && e.request.url.indexOf(self.location.origin) === 0) {
          var copy = res.clone();
          caches.open(CACHE_VERSION).then(function (c) { c.put(e.request, copy); });
        }
        return res;
      });
    })
  );
});
