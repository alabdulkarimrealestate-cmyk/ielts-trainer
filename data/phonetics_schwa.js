/* ============================================================
   صوتيات (٥د): اقتناص الشوا — أي المقاطع حركتُه مختزلة /ə/؟
   Phonetics 5d: Schwa-spotting
   ------------------------------------------------------------
   النوع "multiselect": يحدّد المستخدم المقطع/المقاطع التي تحمل
   الشوا (الحركة المختزلة غير المنبورة).
   { id, rule:"schwa", type:"multiselect",
     word, syllables:[...], schwa_indices:[...], explanation }
   الشوا أكثر صوت في الإنجليزية، وإهماله سبب رئيسي للإيقاع الآلي.
   ============================================================ */
window.IELTS_DATA = window.IELTS_DATA || {};
window.IELTS_DATA.schwa = [
  { id: "sc01", rule: "schwa", type: "multiselect", word: "about",
    syllables: ["a", "bout"], schwa_indices: [0],
    explanation: "a-BOUT: المقطع الأول غير منبور = شوا /ə/. النبر على bout." },
  { id: "sc02", rule: "schwa", type: "multiselect", word: "banana",
    syllables: ["ba", "na", "na"], schwa_indices: [0, 2],
    explanation: "bə-NA-nə: المقطعان الأول والأخير شوا، والنبر على الأوسط NA /ɑː/." },
  { id: "sc03", rule: "schwa", type: "multiselect", word: "teacher",
    syllables: ["tea", "cher"], schwa_indices: [1],
    explanation: "TEA-cher: لاحقة -er غير المنبورة = شوا /ə/." },
  { id: "sc04", rule: "schwa", type: "multiselect", word: "computer",
    syllables: ["com", "pu", "ter"], schwa_indices: [0, 2],
    explanation: "cəm-PU-tə: الأول والأخير شوا، والنبر على PU." },
  { id: "sc05", rule: "schwa", type: "multiselect", word: "doctor",
    syllables: ["doc", "tor"], schwa_indices: [1],
    explanation: "DOC-tə: لاحقة -or غير المنبورة = شوا، ليست واواً." },
  { id: "sc06", rule: "schwa", type: "multiselect", word: "problem",
    syllables: ["prob", "lem"], schwa_indices: [1],
    explanation: "PROB-ləm: المقطع الثاني مختزل إلى شوا." },
  { id: "sc07", rule: "schwa", type: "multiselect", word: "support",
    syllables: ["sup", "port"], schwa_indices: [0],
    explanation: "sə-PORT: المقطع الأول غير المنبور شوا، والنبر على PORT." },
  { id: "sc08", rule: "schwa", type: "multiselect", word: "pencil",
    syllables: ["pen", "cil"], schwa_indices: [1],
    explanation: "PEN-səl: المقطع الثاني شوا." },
  { id: "sc09", rule: "schwa", type: "multiselect", word: "afford",
    syllables: ["af", "ford"], schwa_indices: [0],
    explanation: "ə-FORD: المقطع الأول شوا، والنبر على FORD." },
  { id: "sc10", rule: "schwa", type: "multiselect", word: "famous",
    syllables: ["fa", "mous"], schwa_indices: [1],
    explanation: "FA-məs: لاحقة -ous غير المنبورة = شوا." },
  { id: "sc11", rule: "schwa", type: "multiselect", word: "November",
    syllables: ["No", "vem", "ber"], schwa_indices: [0, 2],
    explanation: "Nə-VEM-bə: الأول والأخير شوا، والنبر على VEM." },
  { id: "sc12", rule: "schwa", type: "multiselect", word: "agenda",
    syllables: ["a", "gen", "da"], schwa_indices: [0, 2],
    explanation: "ə-GEN-də: الأول والأخير شوا، والنبر على GEN." },
  { id: "sc13", rule: "schwa", type: "multiselect", word: "percent",
    syllables: ["per", "cent"], schwa_indices: [0],
    explanation: "pə-CENT: المقطع الأول شوا، والنبر على CENT." }
];
