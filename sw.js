/* sw.js — offline cache for the whole app (cache-first).
   Bump CACHE_VERSION whenever you edit any file so devices pick up changes. */
var CACHE_VERSION = "ielts-trainer-v36";

var ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./css/styles.css?v=36",
  "./data/grammar.js?v=36",
  "./data/vocab.js?v=36",
  "./data/phonetics.js?v=36",
  "./data/pron_dict.js?v=36",
  "./data/collocations.js?v=36",
  "./data/writing_prompts.js?v=36",
  "./data/roadmap.js?v=36",
  "./data/plan.js?v=36",
  "./data/speaking_cards.js?v=36",
  "./data/speaking_qbank.js?v=36",
  "./data/pron_units.js?v=36",
  "./data/vocab_awl.js?v=36",
  "./data/grammar_more.js?v=36",
  "./data/vocab_more.js?v=36",
  "./data/reading.js?v=36",
  "./data/listening.js?v=36",
  "./data/modules/_index.js?v=36",
  "./data/modules/articles.js?v=36",
  "./data/modules/verb_forms.js?v=36",
  "./data/modules/copula_agreement.js?v=36",
  "./data/modules/reversal_pairs.js?v=36",
  "./data/modules/phonetics.js?v=36",
  "./data/modules/collocations.js?v=36",
  "./data/modules/vocab_awl.js?v=36",
  "./data/modules/tenses.js?v=36",
  "./data/modules/conditionals.js?v=36",
  "./data/modules/passive_voice.js?v=36",
  "./data/modules/relative_clauses.js?v=36",
  "./data/modules/countability.js?v=36",
  "./data/modules/word_forms.js?v=36",
  "./data/modules/connectors.js?v=36",
  "./data/modules/preposition_pairs.js?v=36",
  "./data/modules/find_error.js?v=36",
  "./data/modules/trend_language.js?v=36",
  "./data/modules/vocab_topics.js?v=36",
  "./data/modules/phrasal_verbs.js?v=36",
  "./js/config.js?v=36",
  "./js/engine.js?v=36",
  "./js/plan.js?v=36",
  "./js/tracker.js?v=36",
  "./js/ai.js?v=36",
  "./js/storage.js?v=36",
  "./js/sync.js?v=36",
  "./js/drills.js?v=36",
  "./js/session.js?v=36",
  "./js/diagrams.js?v=36",
  "./js/dashboard.js?v=36",
  "./js/prompts.js?v=36",
  "./js/chat.js?v=36",
  "./js/assistant.js?v=36",
  "./js/recorder.js?v=36",
  "./js/pron.js?v=36",
  "./js/speak.js?v=36",
  "./js/views_prep.js?v=36",
  "./js/rl.js?v=36",
  "./js/app.js?v=36",
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
