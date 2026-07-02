/* ============================================================================
 * roadmap.js — the six-stage year-long roadmap (خريطة الكتابة من 5 إلى 7)
 * ----------------------------------------------------------------------------
 * DATA FILE — edit freely, no code changes needed.
 *
 * status values:
 *   "locked"         لم تُفتح بعد
 *   "active"         قيد العمل الآن
 *   "closed_fragile" أُغلقت لكنها هشّة تحت الضغط — تبقى في جلسات الضغط
 *   "consolidated"   مثبّتة (يقرّرها أحمد مع مدرّبه — التطبيق يقترح فقط)
 *
 * The app NEVER auto-advances a stage. It only shows gate progress and
 * suggests when criteria look met. Statuses here are the defaults; the
 * user's manual overrides are stored with his progress data.
 *
 * gate (per rule, editable): accuracy target in LOAD mode across a minimum
 * number of load sessions on a minimum number of distinct days.
 * ========================================================================== */
window.ROADMAP = {

  default_gate: { min_accuracy: 0.90, min_load_sessions: 3, min_days: 2 },

  stages: [
    {
      id: 1,
      name_ar: "المرحلة ١ — أساسيات القواعد",
      name_en: "Core grammar foundations",
      desc_ar: "الأدوات، صيغ الأفعال، الرابط والتطابق — أُغلقت لكنها تنهار تحت الضغط",
      status: "closed_fragile",
      modules: ["articles", "verb_forms", "copula_agreement", "reversal_pairs", "phonetics"]
    },
    {
      id: 2,
      name_ar: "المرحلة ٢ — الجمل المركّبة بالروابط",
      name_en: "Complex sentences with connectors",
      desc_ar: "because / although / if / when — موضع الفاصلة واكتمال العبارات",
      status: "active",
      modules: ["connectors"],
      note_ar: "المحتوى يُضاف تدريجيًا مع جلسات التدريس — أسقط ملف connectors.js في data/modules/ وأضف اسمه في _index.js"
    },
    {
      id: 3,
      name_ar: "المرحلة ٣ — المتلازمات والمفردات",
      name_en: "Collocations & vocabulary",
      desc_ar: "make/do/take/have + أزواج حروف الجر (contribution to, attention to…)",
      status: "active",
      modules: ["collocations", "preposition_pairs"]
    },
    {
      id: 4,
      name_ar: "المرحلة ٤ — بناء الفقرة والتماسك",
      name_en: "Paragraph structure & cohesion",
      desc_ar: "تُفتح بعد تثبيت المرحلتين ٢ و٣",
      status: "locked",
      modules: []
    },
    {
      id: 5,
      name_ar: "المرحلة ٥ — مقالات Task 2 كاملة تحت ضغط الوقت",
      name_en: "Full Task 2 essays under time pressure",
      status: "locked",
      modules: []
    },
    {
      id: 6,
      name_ar: "المرحلة ٦ — تثبيت باند ٧",
      name_en: "Band 7 stabilization (cold, timed, varied topics)",
      status: "locked",
      modules: []
    }
  ]
};
