/* Module: Phrasal verbs — neutral / academic-leaning phrasal verbs.
 * Items live in data/vocab_more.js (BANK_VOCAB_MORE.phrasal_verbs) — edit or add items there. */
window.registerModule({
  module_id: "phrasal_verbs",
  name_ar: "الأفعال المركّبة (phrasal verbs)",
  name_en: "Phrasal verbs",
  stage_id: 3,
  mode: "maintenance",
  rules: [
    { id: "phrasal_verbs", label: "الأفعال المركّبة (phrasal verbs)", group: "المفردات", short: "الأفعال المركّبة" }
  ],
  items: (window.BANK_VOCAB_MORE || {}).phrasal_verbs || []
});
