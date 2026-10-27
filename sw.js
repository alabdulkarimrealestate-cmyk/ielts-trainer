/* sw.js — offline cache for the whole app (cache-first).
   Bump CACHE_VERSION whenever you edit any file so devices pick up changes. */
var CACHE_VERSION = "ielts-trainer-v12";

var ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./css/styles.css?v=12",
  "./data/grammar.js?v=12",
  "./data/vocab.js?v=12",
  "./data/phonetics.js?v=12",
  "./data/pron_dict.js?v=12",
  "./data/collocations.js?v=12",
  "./data/writing_prompts.js?v=12",
  "./data/roadmap.js?v=12",
  "./data/plan.js?v=12",
  "./data/speaking_cards.js?v=12",
  "./data/vocab_awl.js?v=12",
  "./data/modules/_index.js?v=12",
  "./data/modules/articles.js?v=12",
  "./data/modules/verb_forms.js?v=12",
  "./data/modules/copula_agreement.js?v=12",
  "./data/modules/reversal_pairs.js?v=12",
  "./data/modules/phonetics.js?v=12",
  "./data/modules/collocations.js?v=12",
  "./data/modules/vocab_awl.js?v=12",
  "./js/config.js?v=12",
  "./js/engine.js?v=12",
  "./js/plan.js?v=12",
  "./js/tracker.js?v=12",
  "./js/ai.js?v=12",
  "./js/storage.js?v=12",
  "./js/sync.js?v=12",
  "./js/drills.js?v=12",
  "./js/session.js?v=12",
  "./js/diagrams.js?v=12",
  "./js/dashboard.js?v=12",
  "./js/prompts.js?v=12",
  "./js/chat.js?v=12",
  "./js/assistant.js?v=12",
  "./js/views_prep.js?v=12",
  "./js/app.js?v=12",
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
  // The page itself ignores the query (?date=… must work offline); every other
  // asset matches its exact ?v= stamp, so a new release is never served stale.
  var isPage = e.request.mode === "navigate" || /\/(index\.html)?(\?.*)?$/.test(e.request.url);
  e.respondWith(
    caches.match(e.request, { ignoreSearch: isPage }).then(function (hit) {
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
