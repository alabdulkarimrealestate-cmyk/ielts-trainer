/* Module: Dependent prepositions — Roadmap stage 3 — preposition pairs (depend on, responsible for).
 * Items live in data/grammar_more.js (BANK_GRAMMAR_MORE.dependent_prepositions) — edit or add items there. */
window.registerModule({
  module_id: "preposition_pairs",
  name_ar: "حروف الجر بعد الأفعال والصفات والأسماء",
  name_en: "Dependent prepositions",
  stage_id: 3,
  mode: "active",
  rules: [
    { id: "dependent_prepositions", label: "حروف الجر بعد الأفعال والصفات والأسماء", group: "القواعد", short: "حروف الجر" }
  ],
  items: (window.BANK_GRAMMAR_MORE || {}).dependent_prepositions || []
});
