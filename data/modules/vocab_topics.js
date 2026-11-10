/* Module: Topic vocabulary — B2-C1 words for Task 2 / Speaking Part 3 themes.
 * Items live in data/vocab_more.js (BANK_VOCAB_MORE.vocab_topics) — edit or add items there. */
window.registerModule({
  module_id: "vocab_topics",
  name_ar: "مفردات المواضيع (بيئة · تقنية · صحة · تعليم · مجتمع · مدن)",
  name_en: "Topic vocabulary",
  stage_id: 3,
  mode: "maintenance",
  rules: [
    { id: "vocab_topics", label: "مفردات المواضيع (بيئة · تقنية · صحة · تعليم · مجتمع · مدن)", group: "المفردات", short: "مفردات المواضيع" }
  ],
  items: (window.BANK_VOCAB_MORE || {}).vocab_topics || []
});
