/* sw.js — offline cache for the whole app (cache-first).
   Bump CACHE_VERSION whenever you edit any file so devices pick up changes. */
var CACHE_VERSION = "ielts-trainer-v39";

var ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./css/styles.css?v=39",
  "./data/grammar.js?v=39",
  "./data/vocab.js?v=39",
  "./data/phonetics.js?v=39",
  "./data/pron_dict.js?v=39",
  "./data/collocations.js?v=39",
  "./data/writing_prompts.js?v=39",
  "./data/roadmap.js?v=39",
  "./data/plan.js?v=39",
  "./data/speaking_cards.js?v=39",
  "./data/speaking_qbank.js?v=39",
  "./data/pron_units.js?v=39",
  "./data/vocab_awl.js?v=39",
  "./data/grammar_more.js?v=39",
  "./data/vocab_more.js?v=39",
  "./data/reading.js?v=39",
  "./data/listening.js?v=39",
  "./data/modules/_index.js?v=39",
  "./data/modules/articles.js?v=39",
  "./data/modules/verb_forms.js?v=39",
  "./data/modules/copula_agreement.js?v=39",
  "./data/modules/reversal_pairs.js?v=39",
  "./data/modules/phonetics.js?v=39",
  "./data/modules/collocations.js?v=39",
  "./data/modules/vocab_awl.js?v=39",
  "./data/modules/tenses.js?v=39",
  "./data/modules/conditionals.js?v=39",
  "./data/modules/passive_voice.js?v=39",
  "./data/modules/relative_clauses.js?v=39",
  "./data/modules/countability.js?v=39",
  "./data/modules/word_forms.js?v=39",
  "./data/modules/connectors.js?v=39",
  "./data/modules/preposition_pairs.js?v=39",
  "./data/modules/find_error.js?v=39",
  "./data/modules/trend_language.js?v=39",
  "./data/modules/vocab_topics.js?v=39",
  "./data/modules/phrasal_verbs.js?v=39",
  "./js/config.js?v=39",
  "./js/engine.js?v=39",
  "./js/plan.js?v=39",
  "./js/tracker.js?v=39",
  "./js/ai.js?v=39",
  "./js/storage.js?v=39",
  "./js/sync.js?v=39",
  "./js/drills.js?v=39",
  "./js/session.js?v=39",
  "./js/diagrams.js?v=39",
  "./js/dashboard.js?v=39",
  "./js/prompts.js?v=39",
  "./js/chat.js?v=39",
  "./js/assistant.js?v=39",
  "./js/recorder.js?v=39",
  "./js/pron.js?v=39",
  "./js/speak.js?v=39",
  "./js/views_prep.js?v=39",
  "./js/rl.js?v=39",
  "./js/app.js?v=39",
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
