/* Module: Academic Word List vocabulary (Stage 3). Items live in data/vocab_awl.js.
 * Words Gemini flags in Ahmed's essays are added at runtime (Store.addedVocab) under the same rule. */
window.registerModule({
  module_id: "vocab_awl",
  name_ar: "مفردات أكاديمية (AWL)",
  name_en: "Academic Word List",
  stage_id: 3,
  mode: "active",
  rules: [
    { id: "vocab_awl", label: "مفردات أكاديمية (AWL)", group: "المفردات", short: "AWL" }
  ],
  items: window.BANK_VOCAB_AWL || []
});
