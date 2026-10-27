/* sw.js — offline cache for the whole app (cache-first).
   Bump CACHE_VERSION whenever you edit any file so devices pick up changes. */
var CACHE_VERSION = "ielts-trainer-v13";

var ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./css/styles.css?v=13",
  "./data/grammar.js?v=13",
  "./data/vocab.js?v=13",
  "./data/phonetics.js?v=13",
  "./data/pron_dict.js?v=13",
  "./data/collocations.js?v=13",
  "./data/writing_prompts.js?v=13",
  "./data/roadmap.js?v=13",
  "./data/plan.js?v=13",
  "./data/speaking_cards.js?v=13",
  "./data/vocab_awl.js?v=13",
  "./data/modules/_index.js?v=13",
  "./data/modules/articles.js?v=13",
  "./data/modules/verb_forms.js?v=13",
  "./data/modules/copula_agreement.js?v=13",
  "./data/modules/reversal_pairs.js?v=13",
  "./data/modules/phonetics.js?v=13",
  "./data/modules/collocations.js?v=13",
  "./data/modules/vocab_awl.js?v=13",
  "./js/config.js?v=13",
  "./js/engine.js?v=13",
  "./js/plan.js?v=13",
  "./js/tracker.js?v=13",
  "./js/ai.js?v=13",
  "./js/storage.js?v=13",
  "./js/sync.js?v=13",
  "./js/drills.js?v=13",
  "./js/session.js?v=13",
  "./js/diagrams.js?v=13",
  "./js/dashboard.js?v=13",
  "./js/prompts.js?v=13",
  "./js/chat.js?v=13",
  "./js/assistant.js?v=13",
  "./js/views_prep.js?v=13",
  "./js/app.js?v=13",
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
