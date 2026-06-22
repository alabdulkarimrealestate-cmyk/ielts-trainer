/* ============================================================
   صوتيات (٥ب): نبر الجملة — أي الكلمات تُنبَر؟
   Phonetics 5b: Sentence stress (content vs function words)
   ------------------------------------------------------------
   النوع "multiselect": يحدّد المستخدم الكلمات المنبورة.
   { id, rule:"sentence_stress", type:"multiselect",
     words:[...], stressed_indices:[...], explanation }
   الهدف: مهاجمة الإيقاع العربي المتساوي المقاطع مقابل الإنجليزي
   المعتمد على النبر. الكلمات المعجمية (أفعال/أسماء/صفات/ظروف)
   تُنبَر؛ الوظيفية (حروف جر/أدوات/ضمائر) لا تُنبَر غالباً.
   ============================================================ */
window.IELTS_DATA = window.IELTS_DATA || {};
window.IELTS_DATA.sentence_stress = [
  { id: "ss01", rule: "sentence_stress", type: "multiselect",
    words: ["I", "want", "to", "buy", "a", "new", "car"],
    stressed_indices: [1, 3, 5, 6],
    explanation: "الكلمات المعجمية تُنبَر: want, buy, new, car. الوظيفية (I, to, a) خفيفة." },
  { id: "ss02", rule: "sentence_stress", type: "multiselect",
    words: ["She", "is", "going", "to", "the", "meeting"],
    stressed_indices: [2, 5],
    explanation: "going و meeting (معجمية) تُنبَران؛ She/is/to/the وظيفية وخفيفة." },
  { id: "ss03", rule: "sentence_stress", type: "multiselect",
    words: ["Can", "you", "help", "me", "with", "this"],
    stressed_indices: [2, 5],
    explanation: "help (فعل) و this (إشارة مهمة) تُنبَران؛ Can/you/me/with خفيفة." },
  { id: "ss04", rule: "sentence_stress", type: "multiselect",
    words: ["The", "report", "is", "due", "tomorrow"],
    stressed_indices: [1, 3, 4],
    explanation: "report, due, tomorrow معجمية تُنبَر؛ The/is خفيفة." },
  { id: "ss05", rule: "sentence_stress", type: "multiselect",
    words: ["We", "need", "to", "increase", "our", "profits"],
    stressed_indices: [1, 3, 5],
    explanation: "need, increase, profits معجمية؛ We/to/our وظيفية." },
  { id: "ss06", rule: "sentence_stress", type: "multiselect",
    words: ["He", "works", "in", "a", "big", "company"],
    stressed_indices: [1, 4, 5],
    explanation: "works, big, company معجمية؛ He/in/a خفيفة." },
  { id: "ss07", rule: "sentence_stress", type: "multiselect",
    words: ["I", "would", "like", "a", "cup", "of", "coffee"],
    stressed_indices: [2, 4, 6],
    explanation: "like, cup, coffee معجمية؛ I/would/a/of خفيفة (of تُختزل إلى /əv/)." },
  { id: "ss08", rule: "sentence_stress", type: "multiselect",
    words: ["They", "are", "studying", "for", "the", "exam"],
    stressed_indices: [2, 5],
    explanation: "studying و exam معجمية؛ They/are/for/the خفيفة." },
  { id: "ss09", rule: "sentence_stress", type: "multiselect",
    words: ["Please", "send", "me", "the", "documents"],
    stressed_indices: [1, 4],
    explanation: "send و documents تُنبَران؛ me/the خفيفة (Please غالباً خفيفة في النطق المحايد)." },
  { id: "ss10", rule: "sentence_stress", type: "multiselect",
    words: ["The", "economy", "is", "growing", "fast"],
    stressed_indices: [1, 3, 4],
    explanation: "economy, growing, fast معجمية؛ The/is خفيفة." },
  { id: "ss11", rule: "sentence_stress", type: "multiselect",
    words: ["I", "have", "finished", "the", "annual", "budget"],
    stressed_indices: [2, 4, 5],
    explanation: "finished, annual, budget معجمية؛ have هنا فعل مساعد خفيف، I/the وظيفية." },
  { id: "ss12", rule: "sentence_stress", type: "multiselect",
    words: ["Our", "profits", "have", "increased", "this", "year"],
    stressed_indices: [1, 3, 5],
    explanation: "profits, increased, year معجمية؛ Our/have/this خفيفة." }
];
