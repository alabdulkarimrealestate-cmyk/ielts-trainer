/* Module: Word forms — noun / verb / adjective / adverb forms.
 * Items live in data/grammar_more.js (BANK_GRAMMAR_MORE.word_forms) — edit or add items there. */
window.registerModule({
  module_id: "word_forms",
  name_ar: "اشتقاق الكلمة (اسم · فعل · صفة · حال)",
  name_en: "Word forms",
  stage_id: 2,
  mode: "active",
  rules: [
    { id: "word_forms", label: "اشتقاق الكلمة (اسم · فعل · صفة · حال)", group: "القواعد", short: "الاشتقاق" }
  ],
  items: (window.BANK_GRAMMAR_MORE || {}).word_forms || []
});
