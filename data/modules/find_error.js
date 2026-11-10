/* Module: Find the error — proofreading: tap the one wrong word (typical Arabic-L1 errors).
 * Items live in data/grammar_more.js (BANK_GRAMMAR_MORE.find_error) — edit or add items there. */
window.registerModule({
  module_id: "find_error",
  name_ar: "اكتشف الخطأ (تدقيق)",
  name_en: "Find the error",
  stage_id: 1,
  mode: "active",
  rules: [
    { id: "find_error", label: "اكتشف الخطأ (تدقيق)", group: "القواعد", short: "اكتشف الخطأ" }
  ],
  items: (window.BANK_GRAMMAR_MORE || {}).find_error || []
});
