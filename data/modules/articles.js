/* Module: Articles — a/an/the/zero. Long-runway BACKGROUND item, never a gate.
 * Items live in data/grammar.js (rule:"articles") — edit them there. */
window.registerModule({
  module_id: "articles",
  name_ar: "الأدوات (a/an/the)",
  name_en: "Articles",
  stage_id: 1,
  mode: "background",
  never_gate: true,
  rules: [
    { id: "articles", label: "الأدوات (a/an/the)", group: "القواعد", short: "الأدوات" }
  ],
  items: (window.BANK_GRAMMAR || []).filter(function (i) { return i.rule === "articles"; })
});
