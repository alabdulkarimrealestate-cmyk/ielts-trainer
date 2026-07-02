/* Module: Verb forms after prepositions & relative pronouns.
 * Closed at Stage 1 → MAINTENANCE mode (low-frequency resurfacing).
 * Items live in data/grammar.js (rule:"verbform"). */
window.registerModule({
  module_id: "verb_forms",
  name_ar: "صيغة الفعل بعد حروف الجر وضمائر الوصل",
  name_en: "Verb forms",
  stage_id: 1,
  mode: "maintenance",
  rules: [
    { id: "verbform", label: "صيغة الفعل", group: "القواعد", short: "الفعل" }
  ],
  items: (window.BANK_GRAMMAR || []).filter(function (i) { return i.rule === "verbform"; })
});
