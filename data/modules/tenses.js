/* Module: Tenses — present perfect vs past simple vs past perfect, future forms.
 * Items live in data/grammar_more.js (BANK_GRAMMAR_MORE.tenses) — edit or add items there. */
window.registerModule({
  module_id: "tenses",
  name_ar: "الأزمنة",
  name_en: "Tenses",
  stage_id: 2,
  mode: "maintenance",
  rules: [
    { id: "tenses", label: "الأزمنة", group: "القواعد", short: "الأزمنة" }
  ],
  items: (window.BANK_GRAMMAR_MORE || {}).tenses || []
});
