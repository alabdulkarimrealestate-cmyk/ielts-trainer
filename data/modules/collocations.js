/* Module: Collocations (Stage 3) — from English Collocations in Use.
 * New units are added to data/collocations.js as coaching opens them.
 * Preposition pairs (contribution to, attention to...) will arrive as a
 * separate module file (preposition_pairs.js) when Stage 3 coaching opens. */
window.registerModule({
  module_id: "collocations",
  name_ar: "المتلازمات اللفظية",
  name_en: "Collocations",
  stage_id: 3,
  mode: "active",
  rules: [
    { id: "collocations", label: "المتلازمات اللفظية", group: "المفردات", short: "متلازمات" }
  ],
  items: window.BANK_COLLOCATIONS || []
});
