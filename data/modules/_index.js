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
  "collocations.js"
];

window.MODULES = [];
window.registerModule = function (m) { window.MODULES.push(m); };

(function () {
  var base = "data/modules/";
  window.MODULE_FILES.forEach(function (f) {
    /* eslint-disable-next-line no-document-write */
    document.write('<script src="' + base + f + '"><\/script>');
  });
})();
