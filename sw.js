/* sw.js — offline cache for the whole app (cache-first).
   Bump CACHE_VERSION whenever you edit any file so devices pick up changes. */
var CACHE_VERSION = "ielts-trainer-v11";

var ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./css/styles.css?v=11",
  "./data/grammar.js?v=11",
  "./data/vocab.js?v=11",
  "./data/phonetics.js?v=11",
  "./data/pron_dict.js?v=11",
  "./data/collocations.js?v=11",
  "./data/writing_prompts.js?v=11",
  "./data/roadmap.js?v=11",
  "./data/plan.js?v=11",
  "./data/speaking_cards.js?v=11",
  "./data/vocab_awl.js?v=11",
  "./data/modules/_index.js?v=11",
  "./data/modules/articles.js?v=11",
  "./data/modules/verb_forms.js?v=11",
  "./data/modules/copula_agreement.js?v=11",
  "./data/modules/reversal_pairs.js?v=11",
  "./data/modules/phonetics.js?v=11",
  "./data/modules/collocations.js?v=11",
  "./data/modules/vocab_awl.js?v=11",
  "./js/config.js?v=11",
  "./js/engine.js?v=11",
  "./js/plan.js?v=11",
  "./js/tracker.js?v=11",
  "./js/ai.js?v=11",
  "./js/storage.js?v=11",
  "./js/sync.js?v=11",
  "./js/drills.js?v=11",
  "./js/session.js?v=11",
  "./js/diagrams.js?v=11",
  "./js/dashboard.js?v=11",
  "./js/prompts.js?v=11",
  "./js/chat.js?v=11",
  "./js/views_prep.js?v=11",
  "./js/app.js?v=11",
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
