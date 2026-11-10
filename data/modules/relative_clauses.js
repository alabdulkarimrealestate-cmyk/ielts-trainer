/* Module: Relative clauses — defining / non-defining relative clauses.
 * Items live in data/grammar_more.js (BANK_GRAMMAR_MORE.relative_clauses) — edit or add items there. */
window.registerModule({
  module_id: "relative_clauses",
  name_ar: "جمل الصلة (who · which · that · whose)",
  name_en: "Relative clauses",
  stage_id: 2,
  mode: "maintenance",
  rules: [
    { id: "relative_clauses", label: "جمل الصلة (who · which · that · whose)", group: "القواعد", short: "الصلة" }
  ],
  items: (window.BANK_GRAMMAR_MORE || {}).relative_clauses || []
});
