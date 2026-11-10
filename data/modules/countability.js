/* Module: Countable / uncountable nouns — furniture/advice/information, much/many, fewer/less.
 * Items live in data/grammar_more.js (BANK_GRAMMAR_MORE.countability) — edit or add items there. */
window.registerModule({
  module_id: "countability",
  name_ar: "المعدود وغير المعدود والكميات",
  name_en: "Countable / uncountable nouns",
  stage_id: 1,
  mode: "maintenance",
  rules: [
    { id: "countability", label: "المعدود وغير المعدود والكميات", group: "القواعد", short: "المعدود" }
  ],
  items: (window.BANK_GRAMMAR_MORE || {}).countability || []
});
