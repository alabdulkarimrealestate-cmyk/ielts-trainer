/* ============================================================================
 * plan.js — THE EXAM PLAN (IELTS Academic, Feb 2027).  DATA FILE — edit freely.
 * ----------------------------------------------------------------------------
 * Source: "IELTS Academic Plan 2026–27" (Ahmed, 2026-10-27). The app reads this
 * file to build the "اليوم" checklist, phase banner, weekly targets, planned
 * hours (derived from the rota sum), the diagnostic → exam-date decision, and
 * the raw→band tables. No code change is needed to adjust any of it.
 *
 * Dates are local calendar days "YYYY-MM-DD". Weeks run Sunday → Saturday
 * (weekday numbers: 0=Sun … 6=Sat; Kuwait weekend = Fri/Sat).
 *
 * Task shape:
 *   { id, skill, label_ar, min, kind, action, logs?, optional?, days?, every_weeks? }
 *   action: "session" | "load" | "rule:<ruleId>" | "writing:1" | "writing:2" |
 *           "log:exam" | "log:speaking" | "cards" | "none"
 *   optional: true  → shown but NOT counted in planned minutes.
 *   days: [weekday…] → fixed-daily task only on those days.
 *   every_weeks: n  → rota task only when weekIndex % n === 0 (biweekly = 2).
 * Phase `to: null` means "until the exam date" (exam_mode) or open-ended.
 * ========================================================================== */
(function () {
  var T = {
    pron:        { id: "pron",        skill: "speaking",   label_ar: "مختبر النطق — جولة الصوت المقترح (Gemini يسمعك)", min: 20, kind: "pron", action: "pron" },
    pron10:      { id: "pron",        skill: "speaking",   label_ar: "مختبر النطق — جولة قصيرة", min: 10, kind: "pron", action: "pron" },
    pron15:      { id: "pron",        skill: "speaking",   label_ar: "مختبر النطق — كلماتي للمراجعة", min: 15, kind: "pron", action: "pron:my_words" },
    vocab:       { id: "vocab",       skill: "vocabulary", label_ar: "مفردات أكاديمية — بطاقات AWL", min: 15, kind: "vocab",    action: "rule:vocab_awl" },
    grammar:     { id: "grammar",     skill: "writing",    label_ar: "جلسة القواعد ١٥ دقيقة (فكّر قبل الكشف)", min: 15, kind: "drill", action: "session", optional: true },
    podcast:     { id: "podcast",     skill: "listening",  label_ar: "بودكاست إنجليزي في الطريق (لا يُحسب من الساعات)", min: 0, kind: "listen", action: "none", optional: true },
    listen2sec:  { id: "listen_2sec", skill: "listening",  label_ar: "Listening: قسمان + مراجعة الأخطاء", min: 40, kind: "practice", action: "log:exam", logs: "exam" },
    listen20:    { id: "listen_20",   skill: "listening",  label_ar: "Listening ٢٠ دقيقة", min: 20, kind: "practice", action: "log:exam", logs: "exam" },
    t1timed:     { id: "t1_timed",    skill: "writing",    label_ar: "Writing Task 1 بالتوقيت (٢٠ د) + تقييم", min: 30, kind: "writing", action: "writing:1", logs: "writing" },
    readPassage: { id: "read_passage", skill: "reading",   label_ar: "Reading: passage واحدة + تحليل كل غلطة", min: 40, kind: "practice", action: "log:exam", logs: "exam" },
    t2write:     { id: "t2_write",    skill: "writing",    label_ar: "Writing Task 2: تخطيط + كتابة (٤٠ د)", min: 40, kind: "writing", action: "writing:2", logs: "writing" },
    speakCards:  { id: "speak_cards", skill: "speaking",   label_ar: "Speaking Part 2 محاكى: بطاقة مسجّلة يقيّمها الممتحن (كرّرها حتى ٣ بطاقات)", min: 40, kind: "speaking", action: "mock:2" },
    lrTest:      { id: "lr_test",     skill: "listening",  label_ar: "امتحان Listening + Reading كامل بالتوقيت + سجل الأخطاء", min: 120, kind: "test", action: "log:exam", logs: "exam" },
    t2rewrite:   { id: "t2_timed_rewrite", skill: "writing", label_ar: "Task 2 بالتوقيت + إعادة كتابته بعد التقييم", min: 90, kind: "writing", action: "writing:2", logs: "writing" },
    italki:      { id: "italki",      skill: "speaking",   label_ar: "حصة italki (٣٠ د) — سجّل الباندات من المدرّس", min: 30, kind: "speaking", action: "log:speaking", logs: "speaking" },
    fullTest:    { id: "full_test",   skill: "all",        label_ar: "امتحان كامل على الكمبيوتر (L+R+W) بالتوقيت", min: 180, kind: "test", action: "log:exam", logs: "exam" },
    mockSpeak:   { id: "mock_speaking", skill: "speaking", label_ar: "Mock Speaking مع المدرّس", min: 30, kind: "speaking", action: "log:speaking", logs: "speaking" },
    cdFormat:    { id: "cd_format",   skill: "all",        label_ar: "تدريب على شكل الامتحان على الكمبيوتر (CD familiarisation)", min: 40, kind: "practice", action: "none" },
    errReview:   { id: "error_review", skill: "all",       label_ar: "مراجعة سجل الأخطاء الأسبوعي", min: 60, kind: "review", action: "none" },
    ielts20:     { id: "ielts_20",    skill: "all",        label_ar: "صيانة IELTS ٢٠ دقيقة (جلسة قواعد)", min: 20, kind: "drill", action: "session" }
  };

  window.PLAN = {
    start: "2026-11-01",
    target: { primary: 7.0, stretch: 8.0 },
    skills: ["listening", "reading", "writing", "speaking"],
    exam: {
      provisionalDate: "2027-02-27",
      examModeFrom: "2027-02-01",
      centre: "IDP Salmiya (Dalal Complex)",
      delivery: "computer-delivered",
      note_ar: "امتحان على الكمبيوتر: النتيجة أسرع، والـ One Skill Retake متاح له فقط."
    },

    phases: [
      { id: "rest", name_ar: "راحة", from: "2026-10-27", to: "2026-10-31", hours: 0,
        focus_ar: "بودكاست إنجليزي لو حبيت — المذاكرة تبدأ ١ نوفمبر.", weekly_targets: {} },
      { id: "warmup", name_ar: "تمهيد", from: "2026-11-01", to: "2026-11-07", hours: 5,
        focus_ar: "عادة يومية: نطق ٢٠ + مفردات ١٥ + جلسة قواعد. بلا امتحانات بعد.",
        weekly_targets: {} },
      { id: "diagnostic", name_ar: "التشخيص", from: "2026-11-08", to: "2026-11-14", hours: 8,
        focus_ar: "امتحان كامل بالتوقيت + تقييم كتابة + حصة Speaking مع مدرّس → درجة لكل مهارة، وميعاد الامتحان يتحدد.",
        must_ar: ["Listening + Reading كامل (Cambridge) في جلسة واحدة", "Task 1 + Task 2 في ٦٠ دقيقة على الكمبيوتر", "تسجيل Speaking كامل + حصة italki"],
        weekly_targets: { tests: 1, essays_t1: 1, essays_t2: 1, speaking: 1 } },
      { id: "build", name_ar: "البناء", from: "2026-11-15", to: "2026-12-31", hours: 10,
        focus_ar: "قوالب الـ Writing، أساس النطق، امتحانا L/R أسبوعيًا، ٣ مقالات Task 2 مقيّمة، وحصة Speaking أسبوعية.",
        weekly_targets: { tests: 2, essays_t1: 1, essays_t2: 3, speaking: 1 } },
      { id: "maintain", name_ar: "الحفاظ (إقفال الشغل)", from: "2027-01-01", to: "2027-01-31", hours: 6,
        focus_ar: "٤٥ دقيقة يوميًا، والـ Writing في الإجازة. المهم ألّا تنقطع العادة.",
        weekly_targets: { tests: 1, essays_t1: 1, essays_t2: 1, speaking: 1, speaking_every_weeks: 2 } },
      { id: "exam_mode", name_ar: "وضع الامتحان", from: "2027-02-01", to: null, hours: 8,
        focus_ar: "امتحانان كاملان أسبوعيًا على الكمبيوتر + Mock Speaking مع المدرّس + التعوّد على شكل الشاشة.",
        weekly_targets: { tests: 2, essays_t1: 1, essays_t2: 1, speaking: 2 } },
      { id: "after_result", name_ar: "بعد النتيجة", from: null, to: null, hours: 0,
        focus_ar: "CPA Australia + EOI — أو One Skill Retake لو مهارة واحدة نزلت عن 7.", weekly_targets: {} },
      { id: "cma", name_ar: "CMA Part 2 + صيانة IELTS", from: "2027-03-01", to: "2027-06-30", hours: 2,
        focus_ar: "المذاكرة التقيلة لـ CMA من أبريل؛ IELTS ٢٠ دقيقة يوميًا فقط.", weekly_targets: {} }
    ],

    fixed_daily: {
      rest:         [T.podcast],
      warmup:       [T.pron, T.vocab, T.grammar, T.podcast],
      diagnostic:   [T.pron, T.vocab],
      build:        [T.pron, T.vocab, T.grammar],
      maintain:     [Object.assign({}, T.listen20, { days: [0, 1, 2, 3, 4] }),
                     Object.assign({}, T.pron10,   { days: [0, 1, 2, 3, 4] }),
                     Object.assign({}, T.vocab,    { days: [0, 1, 2, 3, 4] })],
      exam_mode:    [T.pron15, T.vocab],
      after_result: [],
      cma:          [T.ielts20]
    },

    rota: {
      build: {
        0: [T.listen2sec],
        1: [T.t1timed],
        2: [T.readPassage],
        3: [T.t2write],
        4: [T.speakCards],
        5: [T.lrTest],
        6: [T.t2rewrite, T.italki]
      },
      maintain: {
        5: [T.t1timed, T.t2write],
        6: [T.lrTest, Object.assign({}, T.italki, { every_weeks: 2 })]
      },
      exam_mode: {
        0: [T.fullTest],
        2: [T.mockSpeak],
        3: [T.fullTest],
        4: [T.cdFormat],
        6: [T.mockSpeak, T.errReview]
      }
    },

    /* one-offs for the diagnostic week — any day; stay listed until done */
    diagnostic_tasks: [
      { id: "diag_lr",        skill: "listening", label_ar: "امتحان Listening + Reading كامل (Cambridge، بالتوقيت، جلسة واحدة) — سجّل الدرجتين", min: 160, kind: "test", action: "log:exam", logs: "exam" },
      { id: "diag_w1",        skill: "writing",   label_ar: "Writing Task 1 على الكمبيوتر (٢٠ د) + تقييم", min: 20, kind: "writing", action: "writing:1", logs: "writing" },
      { id: "diag_w2",        skill: "writing",   label_ar: "Writing Task 2 على الكمبيوتر (٤٠ د) + تقييم", min: 40, kind: "writing", action: "writing:2", logs: "writing" },
      { id: "diag_speak_rec", skill: "speaking",  label_ar: "امتحان Speaking محاكى كامل (Part 1-2-3) يسمعه ويقيّمه الممتحن الذكي", min: 15, kind: "speaking", action: "mock:full" },
      { id: "diag_italki",    skill: "speaking",  label_ar: "حصة تقييم مع مدرّس italki — سجّل الباندات", min: 30, kind: "speaking", action: "log:speaking", logs: "speaking" }
    ],

    /* after the diagnostic: lowest skill band → booking window (first match wins) */
    decision_rule: [
      { min: 6.5, label_ar: "كل المهارات ≥ 6.5 → احجز أوائل أو منتصف فبراير", window: ["2027-02-01", "2027-02-15"], suggest: "2027-02-13", cma_ar: "CMA Part 2 في نافذة يونيو كما هو." },
      { min: 6.0, label_ar: "أدنى مهارة 6.0 → احجز آخر فبراير أو أوائل مارس", window: ["2027-02-20", "2027-03-07"], suggest: "2027-02-27", cma_ar: "CMA Part 2 في نافذة يونيو — مع ضغط في مارس." },
      { min: 0,   label_ar: "مهارة ≤ 5.5 → احجز في أبريل (٨ أسابيع لا تكفي)", window: ["2027-04-01", "2027-04-30"], suggest: "2027-04-10", cma_ar: "يتأجّل CMA Part 2 إلى نافذة سبتمبر/أكتوبر 2027." }
    ],

    /* approximate official conversions (40 questions) — [minRaw, band], descending */
    band_tables: {
      listening:        [[39, 9], [37, 8.5], [35, 8], [32, 7.5], [30, 7], [26, 6.5], [23, 6], [18, 5.5], [16, 5], [13, 4.5], [10, 4], [8, 3.5], [6, 3], [4, 2.5]],
      reading_academic: [[39, 9], [37, 8.5], [35, 8], [33, 7.5], [30, 7], [27, 6.5], [23, 6], [19, 5.5], [15, 5], [13, 4.5], [10, 4], [8, 3.5], [6, 3], [4, 2.5]]
    },

    band_anchor_ar: "Band 7 ≈ 30/40 · Band 8 ≈ 35/40 في الـ Listening والـ Reading.",

    writing_types: {
      task1: ["line graph", "bar chart", "table", "pie chart", "process", "map"],
      task2: ["opinion (agree/disagree)", "discussion (both views)", "problem–solution", "two-part question", "advantages–disadvantages"]
    },

    /* pre-submit checklist (Arabic-L1 traps) — must be ticked before evaluation */
    checklist_ar: [
      "راجعت أدوات التعريف (a/an/the) مع كل اسم مفرد معدود",
      "راجعت حروف الجر بعد الأفعال والصفات",
      "لا جمل طويلة مسلسلة بـ and / which — قسّمتها",
      "كل فقرة فكرة واحدة بجملة رئيسية واضحة",
      "عدد الكلمات فوق الحد الأدنى (150 لـ Task 1 / 250 لـ Task 2)"
    ],

    /* AI error tags → drill rule that fixes them (null = no drill yet) */
    error_tags: {
      "ARTICLES": "articles",
      "VERB-FORM": "verbform",
      "COPULA-AGREEMENT": "copula",
      "MEANING-REVERSAL": "meaning_reversal",
      "CONNECTORS": "connectors",
      "COLLOCATION": "collocations",
      "PREPOSITION": null,
      "OTHER": null
    },
    error_tag_labels_ar: {
      "ARTICLES": "الأدوات", "VERB-FORM": "صيغة الفعل", "COPULA-AGREEMENT": "الرابط والتطابق",
      "MEANING-REVERSAL": "معكوسة المعنى", "CONNECTORS": "الروابط", "COLLOCATION": "المتلازمات",
      "PREPOSITION": "حروف الجر", "OTHER": "أخرى"
    },

    error_types_lr: ["إملاء", "True/False/Not Given", "Matching headings", "اختيار من متعدد", "خريطة/رسم", "إكمال جمل/ملخّص", "ضاع الوقت", "لم أفهم المتحدث (القسم 3/4)"],

    resources: [
      { name: "Cambridge IELTS Academic (آخر ٤ إصدارات)", skill_ar: "الكل", use_ar: "الامتحانات الكاملة والتشخيص — أقرب شيء للامتحان الحقيقي", cost_ar: "مدفوع" },
      { name: "Computer-delivered familiarisation test", skill_ar: "الكل", use_ar: "تتعوّد على شكل الشاشة قبل الامتحان", cost_ar: "مجاني", url: "https://ielts.org/take-a-test/preparation-resources" },
      { name: "IELTS Simon", skill_ar: "Writing · Speaking", use_ar: "نماذج مقالات بـ band عالٍ وطريقة بسيطة لبناء المقال", cost_ar: "مجاني", url: "https://ielts-simon.com" },
      { name: "IELTS Liz", skill_ar: "الكل", use_ar: "شرح أنواع الأسئلة ونصائح الـ Reading والـ Listening", cost_ar: "مجاني", url: "https://ieltsliz.com" },
      { name: "Gemini داخل التطبيق + band descriptors", skill_ar: "Writing", use_ar: "تقييم كل مقال بالمعايير الأربعة ومتابعة أخطائك المتكررة", cost_ar: "مجاني (طبقة مجانية)" },
      { name: "italki — مدرّس IELTS (يفضّل ممتحن سابق)", skill_ar: "Speaking · Writing", use_ar: "التقييم البشري الذي لا يستطيعه الذكاء الاصطناعي — مرة أسبوعيًا", cost_ar: "مدفوع بالحصة", url: "https://www.italki.com" },
      { name: "Adrian Underhill — Sound Foundations", skill_ar: "Speaking", use_ar: "أساس الأصوات ومخارجها (p/b، v/f، النبر)", cost_ar: "فيديوهات مجانية" },
      { name: "مختبر النطق + امتحان Speaking داخل التطبيق", skill_ar: "Speaking", use_ar: "تمرين نطق يومي يسمعه Gemini ويقيّمه لكل صوت وكلمة، وامتحان محاكى بالمعايير الأربعة — بديل ELSA", cost_ar: "مجاني (طبقة Gemini المجانية)" },
      { name: "ELSA Speak", skill_ar: "Speaking", use_ar: "اختياري الآن — مقيّم نطق متخصص أدقّ في الأصوات المفردة إن أردت رأيًا ثانيًا", cost_ar: "مجاني مع نسخة مدفوعة" },
      { name: "BBC 6 Minute English + بودكاست اقتصادي", skill_ar: "Listening", use_ar: "في الطريق — مواضيع تهمك لتستمر", cost_ar: "مجاني" },
      { name: "IDP Salmiya (Dalal Complex)", skill_ar: "الامتحان", use_ar: "يقدّم IELTS Academic على الكمبيوتر", cost_ar: "رسوم الامتحان" }
    ]
  };
})();
