/* Module: Copula + subject-verb agreement. Closed but COLLAPSES UNDER LOAD —
 * maintenance mode + always included in load-mode sessions (see load_priority).
 * Items live in data/grammar.js (rule:"copula"). */
window.registerModule({
  module_id: "copula_agreement",
  name_ar: "الرابط والتطابق (is/are، has/have)",
  name_en: "Copula & agreement",
  stage_id: 1,
  mode: "maintenance",
  load_priority: true,
  rules: [
    { id: "copula", label: "الرابط والتطابق", group: "القواعد", short: "الرابط" }
  ],
  items: (window.BANK_GRAMMAR || []).filter(function (i) { return i.rule === "copula"; })
});
