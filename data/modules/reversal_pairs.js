/* Module: Meaning-reversal vocabulary pairs (employer/employee, ...).
 * PERMANENTLY on the watchlist — highest Task Response risk. Never retire.
 * Items live in data/vocab.js — ADD NEW CONFUSABLE PAIRS THERE. */
window.registerModule({
  module_id: "reversal_pairs",
  name_ar: "مفردات معكوسة المعنى",
  name_en: "Meaning-reversal pairs",
  stage_id: 1,
  mode: "active",
  permanent_watchlist: true,
  rules: [
    { id: "meaning_reversal", label: "مفردات معكوسة المعنى", group: "القواعد", short: "مفردات" }
  ],
  items: window.BANK_VOCAB || []
});
