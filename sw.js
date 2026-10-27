/* sw.js — offline cache for the whole app (cache-first).
   Bump CACHE_VERSION whenever you edit any file so devices pick up changes. */
var CACHE_VERSION = "ielts-trainer-v14";

var ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./css/styles.css?v=14",
  "./data/grammar.js?v=14",
  "./data/vocab.js?v=14",
  "./data/phonetics.js?v=14",
  "./data/pron_dict.js?v=14",
  "./data/collocations.js?v=14",
  "./data/writing_prompts.js?v=14",
  "./data/roadmap.js?v=14",
  "./data/plan.js?v=14",
  "./data/speaking_cards.js?v=14",
  "./data/vocab_awl.js?v=14",
  "./data/modules/_index.js?v=14",
  "./data/modules/articles.js?v=14",
  "./data/modules/verb_forms.js?v=14",
  "./data/modules/copula_agreement.js?v=14",
  "./data/modules/reversal_pairs.js?v=14",
  "./data/modules/phonetics.js?v=14",
  "./data/modules/collocations.js?v=14",
  "./data/modules/vocab_awl.js?v=14",
  "./js/config.js?v=14",
  "./js/engine.js?v=14",
  "./js/plan.js?v=14",
  "./js/tracker.js?v=14",
  "./js/ai.js?v=14",
  "./js/storage.js?v=14",
  "./js/sync.js?v=14",
  "./js/drills.js?v=14",
  "./js/session.js?v=14",
  "./js/diagrams.js?v=14",
  "./js/dashboard.js?v=14",
  "./js/prompts.js?v=14",
  "./js/chat.js?v=14",
  "./js/assistant.js?v=14",
  "./js/views_prep.js?v=14",
  "./js/app.js?v=14",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE_VERSION).then(function (c) {
      // cache:"reload" skips the browser's HTTP cache (Pages sends max-age=600),
      // so a new release never stores a 10-minute-old index.html.
      return c.addAll(ASSETS.map(function (u) { return new Request(u, { cache: "reload" }); }));
    }).then(function () { return self.skipWaiting(); })
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
  var isPage = e.request.mode === "navigate" || /\/(index\.html)?(\?.*)?$/.test(e.request.url);
  // The page is NETWORK-FIRST: its URL cannot carry a ?v= stamp, so online it
  // is always revalidated (it lists the stamped assets of the current release);
  // offline it falls back to the cached copy (query ignored, so ?date= works).
  if (isPage) {
    e.respondWith(
      fetch(e.request, { cache: "no-cache" }).then(function (res) {
        if (res.ok) { var copy = res.clone(); caches.open(CACHE_VERSION).then(function (c) { c.put("./index.html", copy); }); }
        return res;
      }).catch(function () {
        return caches.match(e.request, { ignoreSearch: true }).then(function (hit) { return hit || caches.match("./index.html"); });
      })
    );
    return;
  }
  // Stamped assets (?v=N) are immutable for a release: cache-first, exact match.
  e.respondWith(
    caches.match(e.request).then(function (hit) {
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
