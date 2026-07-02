/* Module: Phonetic knowledge — the COGNITIVE layer only (no audio, ever).
 * Word/sentence stress cards carry a "read aloud now" reminder that bridges
 * knowledge → execution; actual audio practice stays in ELSA.
 * Items live in data/phonetics.js. */
window.registerModule({
  module_id: "phonetics",
  name_ar: "المعرفة الصوتية (نبر، IPA، شوا)",
  name_en: "Phonetic knowledge",
  stage_id: 1,
  mode: "active",
  read_aloud_rules: ["word_stress", "sentence_stress"],
  rules: [
    { id: "word_stress",     label: "نبر الكلمة",   group: "الصوتيات", short: "نبر الكلمة" },
    { id: "sentence_stress", label: "نبر الجملة",   group: "الصوتيات", short: "نبر الجملة" },
    { id: "ipa",             label: "رموز IPA",     group: "الصوتيات", short: "IPA" },
    { id: "schwa",           label: "الشوا (schwa)", group: "الصوتيات", short: "schwa" }
  ],
  items: [].concat(
    window.BANK_WORD_STRESS || [],
    window.BANK_SENTENCE_STRESS || [],
    window.BANK_IPA || [],
    window.BANK_SCHWA || []
  )
});
