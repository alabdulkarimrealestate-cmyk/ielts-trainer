/* ============================================================================
 * _index.js — module manifest + loader.  DATA FILE.
 * ----------------------------------------------------------------------------
 * TO ADD A NEW RULE MODULE (e.g. connectors when Stage 2 content opens):
 *   1. Create data/modules/connectors.js (copy the schema from any module).
 *   2. Add "connectors.js" to the list below.
 * That's it — no code changes anywhere else.
 *
 * document.write is intentional: it inserts the module <script> tags
 * synchronously so config.js (which runs next) sees all registered modules.
 * It works from file:// double-click AND over http(s).
 * ========================================================================== */
window.MODULE_FILES = [
  "articles.js",
  "verb_forms.js",
  "copula_agreement.js",
  "reversal_pairs.js",
  "phonetics.js",
  "collocations.js",
  "vocab_awl.js",
  "tenses.js",
  "conditionals.js",
  "passive_voice.js",
  "relative_clauses.js",
  "countability.js",
  "word_forms.js",
  "connectors.js",
  "preposition_pairs.js",
  "find_error.js",
  "trend_language.js",
  "vocab_topics.js",
  "phrasal_verbs.js"
];

window.MODULES = [];
window.registerModule = function (m) { window.MODULES.push(m); };

(function () {
  var base = "data/modules/";
  window.MODULE_FILES.forEach(function (f) {
    /* eslint-disable-next-line no-document-write */
    var v = window.ASSET_VERSION ? "?v=" + window.ASSET_VERSION : "";   // cache-busting stamp (see bump.js)
    document.write('<script src="' + base + f + v + '"><\/script>');
  });
})();
