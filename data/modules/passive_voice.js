/* Module: The passive voice — be + past participle in all tenses and with modals.
 * Items live in data/grammar_more.js (BANK_GRAMMAR_MORE.passive_voice) — edit or add items there. */
window.registerModule({
  module_id: "passive_voice",
  name_ar: "المبني للمجهول",
  name_en: "The passive voice",
  stage_id: 2,
  mode: "maintenance",
  rules: [
    { id: "passive_voice", label: "المبني للمجهول", group: "القواعد", short: "المجهول" }
  ],
  items: (window.BANK_GRAMMAR_MORE || {}).passive_voice || []
});
