/* Module: Conditionals — first / second / third / mixed conditionals.
 * Items live in data/grammar_more.js (BANK_GRAMMAR_MORE.conditionals) — edit or add items there. */
window.registerModule({
  module_id: "conditionals",
  name_ar: "الجمل الشرطية",
  name_en: "Conditionals",
  stage_id: 2,
  mode: "maintenance",
  rules: [
    { id: "conditionals", label: "الجمل الشرطية", group: "القواعد", short: "الشرط" }
  ],
  items: (window.BANK_GRAMMAR_MORE || {}).conditionals || []
});
